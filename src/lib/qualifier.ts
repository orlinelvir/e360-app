// Port 1:1 de la lógica de public/calificador-de-clientes.html del Hub web —
// mismas fórmulas, mismos umbrales, mismo orden de evaluación. Si el jefe
// pide un ajuste a los criterios, hay que replicarlo en los dos lados.

export interface QualifierInputs {
  score: number;
  creditAge: number;
  hasBiz: "" | "si" | "no";
  bizAge: number;
  monthlyDeposits: number;
  negDays: number;
  mcaStack: "" | "no" | "1" | "2+";
  income: number;
  debts: number;
  incomeType: "" | "w2" | "1099" | "mixto" | "ninguno";
  jobYears: number;
  idType: "" | "ssn" | "itin" | "ninguno";
  hasAssets: "" | "si" | "no";
  needed: number;
  monthPositive: "" | "si" | "aveces" | "no";
  purpose: "" | "capital" | "expansion" | "equipo" | "deudas" | "personal" | "casa" | "inversion";
  bankruptcy: "" | "si" | "no";
}

export const EMPTY_QUALIFIER_INPUTS: QualifierInputs = {
  score: 0,
  creditAge: 0,
  hasBiz: "",
  bizAge: 0,
  monthlyDeposits: 0,
  negDays: 0,
  mcaStack: "",
  income: 0,
  debts: 0,
  incomeType: "",
  jobYears: 0,
  idType: "",
  hasAssets: "",
  needed: 0,
  monthPositive: "",
  purpose: "",
  bankruptcy: "",
};

export interface QualifierFactor {
  t: "pass" | "warn" | "fail";
  txt: string;
}

export interface QualifierProduct {
  name: string;
  color: string;
  prob: number;
  min: number;
  max: number;
  factors: QualifierFactor[];
  avatar: string;
  note: string;
}

export function fmt(n: number): string {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
  return "$" + Math.round(n).toLocaleString();
}

export function dti(v: QualifierInputs): number {
  if (!v.income) return 999;
  return (v.debts / v.income) * 100;
}

function clampProb(prob: number): number {
  return Math.max(0, Math.min(100, prob));
}

function evalMCA(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.monthlyDeposits >= 15000) factors.push({ t: "pass", txt: `Depósitos mensuales: ${fmt(v.monthlyDeposits)} ✓` });
  else if (v.monthlyDeposits >= 10000) { factors.push({ t: "warn", txt: `Depósitos: ${fmt(v.monthlyDeposits)} — en el límite mínimo` }); prob -= 20; }
  else if (v.monthlyDeposits >= 5000) { factors.push({ t: "warn", txt: `Depósitos: ${fmt(v.monthlyDeposits)} — por debajo del ideal` }); prob -= 40; }
  else { factors.push({ t: "fail", txt: "Depósitos insuficientes (mín. $5,000/mes)" }); prob -= 70; }

  if (v.bizAge >= 12) factors.push({ t: "pass", txt: `Tiempo en negocio: ${v.bizAge} meses ✓` });
  else if (v.bizAge >= 6) { factors.push({ t: "warn", txt: `Tiempo en negocio: ${v.bizAge} meses — mínimo aceptable` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: "Tiempo en negocio muy corto (mín. 6 meses)" }); prob -= 50; }

  if (v.negDays <= 3) factors.push({ t: "pass", txt: `Días negativos: ${v.negDays}/mes ✓` });
  else if (v.negDays <= 7) { factors.push({ t: "warn", txt: `Días negativos: ${v.negDays}/mes — lenders lo revisan` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: `Demasiados días negativos: ${v.negDays}/mes` }); prob -= 35; }

  if (v.monthPositive === "si") factors.push({ t: "pass", txt: "Termina el mes positivo ✓" });
  else if (v.monthPositive === "aveces") { factors.push({ t: "warn", txt: "No siempre termina positivo" }); prob -= 10; }
  else if (v.monthPositive === "no") { factors.push({ t: "fail", txt: "Frecuentemente termina negativo" }); prob -= 30; }

  if (v.mcaStack === "no") factors.push({ t: "pass", txt: "Sin MCA activo — posición limpia ✓" });
  else if (v.mcaStack === "1") { factors.push({ t: "warn", txt: "1 MCA activo — posible stacking" }); prob -= 20; }
  else if (v.mcaStack === "2+") { factors.push({ t: "fail", txt: "2+ MCAs activos — stacking crítico" }); prob -= 50; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente — limita opciones" }); prob -= 30; }

  if (v.monthlyDeposits > 0) {
    min = Math.round(v.monthlyDeposits * 0.75);
    max = Math.round(v.monthlyDeposits * 1.5);
  }

  return {
    name: "MCA — Merchant Cash Advance", color: "#0d2d5e", prob: clampProb(prob), min, max, factors,
    avatar: "Dueño de negocio con 6+ meses de operación, $5,000-$15,000+/mes en depósitos, menos de 3 días negativos, sin stacking.",
    note: "El lender revisa los últimos 4-6 estados de cuenta bancarios. El crédito es secundario — los depósitos son el factor principal.",
  };
}

function evalPersonalLoan(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 720) factors.push({ t: "pass", txt: `Score ${v.score} — excelente ✓` });
  else if (v.score >= 680) factors.push({ t: "pass", txt: `Score ${v.score} — bueno ✓` });
  else if (v.score >= 640) { factors.push({ t: "warn", txt: `Score ${v.score} — aceptable, tasa más alta` }); prob -= 20; }
  else if (v.score >= 580) { factors.push({ t: "warn", txt: `Score ${v.score} — limitado, opciones reducidas` }); prob -= 45; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — muy bajo para préstamo personal` }); prob -= 80; }

  if (v.creditAge >= 3) factors.push({ t: "pass", txt: `Antigüedad crédito: ${v.creditAge} años ✓` });
  else if (v.creditAge >= 1) { factors.push({ t: "warn", txt: `Antigüedad crédito: ${v.creditAge} años — algo corto` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: "Historial de crédito muy corto" }); prob -= 40; }

  const d = dti(v);
  if (d <= 36) factors.push({ t: "pass", txt: `DTI ${d.toFixed(0)}% — excelente ✓` });
  else if (d <= 43) { factors.push({ t: "warn", txt: `DTI ${d.toFixed(0)}% — aceptable` }); prob -= 15; }
  else if (d <= 50) { factors.push({ t: "warn", txt: `DTI ${d.toFixed(0)}% — alto` }); prob -= 30; }
  else { factors.push({ t: "fail", txt: `DTI ${d.toFixed(0)}% — demasiado alto` }); prob -= 60; }

  if (v.jobYears >= 2) factors.push({ t: "pass", txt: `${v.jobYears} años de empleo estable ✓` });
  else { factors.push({ t: "warn", txt: `Solo ${v.jobYears} años de empleo` }); prob -= 15; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN ✓" });
  else if (v.idType === "itin") { factors.push({ t: "warn", txt: "ITIN — opciones limitadas" }); prob -= 20; }
  else { factors.push({ t: "fail", txt: "Sin SSN/ITIN" }); prob -= 80; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente" }); prob -= 50; }

  if (v.income > 0) { min = Math.round(v.income * 3); max = Math.round(v.income * 8); }

  return {
    name: "Préstamo Personal", color: "#1a4a8a", prob: clampProb(prob), min, max, factors,
    avatar: "Cliente con score 680+, 2+ años de historial, empleo estable 2+ años, DTI menor al 43%, SSN.",
    note: "Los lenders revisan historial de pagos, utilización de crédito, DTI e ingreso verificable. Las tasas van de 7% a 35% según el perfil.",
  };
}

function evalCreditCard(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 720) factors.push({ t: "pass", txt: `Score ${v.score} — ideal para stacking ✓` });
  else if (v.score >= 680) factors.push({ t: "pass", txt: `Score ${v.score} — bueno ✓` });
  else { factors.push({ t: "fail", txt: `Score ${v.score} — se necesita 680+ para credit card stacking` }); prob -= 80; }

  if (v.creditAge >= 2) factors.push({ t: "pass", txt: `Historial ${v.creditAge} años ✓` });
  else { factors.push({ t: "fail", txt: "Se necesitan 2+ años de historial" }); prob -= 60; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN requerido ✓" });
  else { factors.push({ t: "fail", txt: "Se requiere SSN para tarjetas empresariales" }); prob -= 100; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente — descalifica" }); prob -= 80; }

  const d = dti(v);
  if (d <= 40) factors.push({ t: "pass", txt: `DTI ${d.toFixed(0)}% ✓` });
  else { factors.push({ t: "warn", txt: `DTI ${d.toFixed(0)}% — puede limitar los límites` }); prob -= 20; }

  if (v.score >= 680 && v.creditAge >= 2) { min = 30000; max = 150000; }

  return {
    name: "Tarjetas de Crédito Empresariales (0% Stacking)", color: "#4a1a7a", prob: clampProb(prob), min, max, factors,
    avatar: "Score 680+, 2+ años de historial, SSN requerido, sin bancarrota, DTI menor al 40%.",
    note: "Se aplica a múltiples tarjetas empresariales simultáneamente. Período introductorio de 0% por 12-18 meses. Fondos disponibles en 2-4 semanas.",
  };
}

function evalFHA(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 620) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else if (v.score >= 580) { factors.push({ t: "warn", txt: `Score ${v.score} — califica pero requiere 10% enganche` }); prob -= 20; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — mínimo 580 para FHA` }); prob -= 80; }

  if (v.jobYears >= 2) factors.push({ t: "pass", txt: `${v.jobYears} años de empleo estable ✓` });
  else { factors.push({ t: "warn", txt: `Solo ${v.jobYears} años de empleo` }); prob -= 25; }

  const d = dti(v);
  if (d <= 43) factors.push({ t: "pass", txt: `DTI ${d.toFixed(0)}% ✓` });
  else if (d <= 50) { factors.push({ t: "warn", txt: `DTI ${d.toFixed(0)}% — en el límite` }); prob -= 20; }
  else { factors.push({ t: "fail", txt: `DTI ${d.toFixed(0)}% — demasiado alto` }); prob -= 60; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN ✓" });
  else if (v.idType === "itin") { factors.push({ t: "warn", txt: "ITIN — algunos lenders FHA aceptan" }); prob -= 30; }
  else { factors.push({ t: "fail", txt: "Se requiere SSN o ITIN" }); prob -= 80; }

  if (v.incomeType === "w2" || v.incomeType === "mixto") factors.push({ t: "pass", txt: "Ingreso W-2 verificable ✓" });
  else if (v.incomeType === "1099") { factors.push({ t: "warn", txt: "Self-employed — necesita 2 años de tax returns" }); prob -= 15; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota — espera de 2 años requerida" }); prob -= 60; }

  if (v.income > 0) {
    const maxPmt = v.income * 0.31;
    const estRate = 7.5 / 100 / 12;
    const n = 30 * 12;
    const loanAmt = (maxPmt * (Math.pow(1 + estRate, n) - 1)) / (estRate * Math.pow(1 + estRate, n));
    max = Math.round(loanAmt * 0.965);
    min = Math.round(max * 0.5);
  }

  return {
    name: "Préstamo FHA — Primera Vivienda", color: "#1a7a3a", prob: clampProb(prob), min, max, factors,
    avatar: "Score 580+, 2 años de empleo, DTI menor al 43%, SSN o ITIN, sin bancarrota en últimos 2 años.",
    note: "Enganche mínimo 3.5% (con score 580+). Requiere MIP anual. Propiedad debe ser vivienda primaria. Cierre en 30-45 días.",
  };
}

function evalConvencional(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 740) factors.push({ t: "pass", txt: `Score ${v.score} — excelente para convencional ✓` });
  else if (v.score >= 680) factors.push({ t: "pass", txt: `Score ${v.score} — bueno ✓` });
  else if (v.score >= 640) { factors.push({ t: "warn", txt: `Score ${v.score} — califica con tasa más alta` }); prob -= 20; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — mínimo 640 para convencional` }); prob -= 70; }

  if (v.jobYears >= 2) factors.push({ t: "pass", txt: `${v.jobYears} años de empleo ✓` });
  else { factors.push({ t: "warn", txt: "Se recomiendan 2+ años de empleo" }); prob -= 20; }

  const d = dti(v);
  if (d <= 36) factors.push({ t: "pass", txt: `DTI ${d.toFixed(0)}% — excelente ✓` });
  else if (d <= 45) { factors.push({ t: "warn", txt: `DTI ${d.toFixed(0)}% — aceptable` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: `DTI ${d.toFixed(0)}% — muy alto` }); prob -= 50; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN requerido ✓" });
  else { factors.push({ t: "fail", txt: "Se requiere SSN para convencional" }); prob -= 80; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota — espera de 4 años" }); prob -= 80; }

  if (v.income > 0) {
    const maxPmt = v.income * 0.28;
    const estRate = 7.5 / 100 / 12;
    const n = 30 * 12;
    const loanAmt = (maxPmt * (Math.pow(1 + estRate, n) - 1)) / (estRate * Math.pow(1 + estRate, n));
    max = Math.round(loanAmt * 0.97);
    min = Math.round(max * 0.5);
  }

  return {
    name: "Préstamo Convencional", color: "#0a5a5a", prob: clampProb(prob), min, max, factors,
    avatar: "Score 680+, 2 años de empleo, DTI menor al 43%, SSN, sin bancarrota en 4 años, enganche 3-20%.",
    note: "Enganche desde 3%. Sin MIP si LTV es menor al 80%. Cierre en 30-45 días. Mejores tasas con score 740+.",
  };
}

function evalDSCR(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 680) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else if (v.score >= 640) { factors.push({ t: "warn", txt: `Score ${v.score} — límite inferior` }); prob -= 20; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — mínimo 640 para DSCR` }); prob -= 70; }

  if (v.purpose === "inversion") factors.push({ t: "pass", txt: "Propósito: propiedad de inversión ✓" });
  else { factors.push({ t: "warn", txt: "DSCR es para propiedades de inversión/alquiler" }); prob -= 30; }

  if (v.hasAssets === "si") factors.push({ t: "pass", txt: "Tiene activos / propiedades ✓" });
  else { factors.push({ t: "warn", txt: "Enganche del 20-25% requerido" }); prob -= 10; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente" }); prob -= 60; }

  factors.push({ t: "pass", txt: "No verifica ingreso personal — usa renta de la propiedad" });

  if (v.income > 0) { min = 100000; max = 2000000; } else { min = 100000; max = 1000000; }

  return {
    name: "DSCR — Propiedad de Inversión", color: "#c45000", prob: clampProb(prob), min, max, factors,
    avatar: "Inversionista con score 640+, propiedad que genera renta, enganche 20-25%. No se verifica ingreso personal.",
    note: "El ratio DSCR mínimo es 1.10x (renta ÷ pago mensual). Ideal para LLC o inversionistas. Sin límite de propiedades.",
  };
}

function evalNoIncome(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  const min = 50000;
  const max = 500000;

  if (v.score >= 700) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else if (v.score >= 660) { factors.push({ t: "warn", txt: `Score ${v.score} — aceptable` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — mínimo 660-680` }); prob -= 60; }

  if (v.monthlyDeposits >= 8000) factors.push({ t: "pass", txt: `Depósitos ${fmt(v.monthlyDeposits)}/mes — se usan en lugar de income ✓` });
  else { factors.push({ t: "warn", txt: "Se necesitan estados bancarios robustos (12-24 meses)" }); prob -= 20; }

  if (v.hasAssets === "si") factors.push({ t: "pass", txt: "Tiene activos — respalda la aplicación ✓" });
  else { factors.push({ t: "warn", txt: "Sin activos — mayor riesgo para el lender" }); prob -= 25; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente" }); prob -= 60; }

  factors.push({ t: "pass", txt: "No requiere W-2 ni tax returns ✓" });

  return {
    name: "No Income Verification", color: "#8b1a1a", prob: clampProb(prob), min, max, factors,
    avatar: "Score 680+, estados bancarios 12-24 meses, activos o propiedad como respaldo, enganche 20-30%.",
    note: "Tasa aproximadamente 1-2% más alta que convencional. Ideal para self-employed sin declaraciones robustas. Enganche mínimo 20-30%.",
  };
}

function evalSBAMicro(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  const max = 50000;

  if (v.score >= 640) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else { factors.push({ t: "warn", txt: `Score ${v.score} — SBA Micro es más flexible` }); prob -= 20; }

  if (v.bizAge >= 12) factors.push({ t: "pass", txt: `${v.bizAge} meses en negocio ✓` });
  else if (v.bizAge >= 6) { factors.push({ t: "warn", txt: "Tiempo en negocio corto para SBA" }); prob -= 20; }
  else { factors.push({ t: "fail", txt: "Muy poco tiempo en negocio" }); prob -= 50; }

  if (v.hasBiz === "si") factors.push({ t: "pass", txt: "Negocio registrado ✓" });
  else { factors.push({ t: "warn", txt: "Preferiblemente debe estar registrado" }); prob -= 20; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN ✓" });
  else { factors.push({ t: "fail", txt: "SBA generalmente requiere SSN y ciudadanía/residencia" }); prob -= 60; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota — puede descalificar para SBA" }); prob -= 70; }

  return {
    name: "SBA Microloan (hasta $50K)", color: "#1a5a3a", prob: clampProb(prob), min: 5000, max, factors,
    avatar: "Negocio pequeño o startup, score 640+, SSN, negocio registrado. Ideal para negocios en sus primeros años.",
    note: "Monto máximo $50,000. Tasa de 8-13%. Plazo de hasta 6 años. Algunos programas no requieren colateral. Proceso 2-4 semanas.",
  };
}

function evalSBA7a(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  let min = 0;
  let max = 0;

  if (v.score >= 680) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else if (v.score >= 650) { factors.push({ t: "warn", txt: `Score ${v.score} — en el límite` }); prob -= 25; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — mínimo 680 preferiblemente` }); prob -= 60; }

  if (v.bizAge >= 24) factors.push({ t: "pass", txt: `${v.bizAge} meses en negocio ✓` });
  else if (v.bizAge >= 12) { factors.push({ t: "warn", txt: `Solo ${v.bizAge} meses — SBA 7a prefiere 2+ años` }); prob -= 30; }
  else { factors.push({ t: "fail", txt: "SBA 7a requiere mínimo 1-2 años de negocio" }); prob -= 70; }

  if (v.hasBiz === "si") factors.push({ t: "pass", txt: "Negocio registrado ✓" });
  else { factors.push({ t: "fail", txt: "Se requiere negocio registrado (LLC/Corp)" }); prob -= 50; }

  if (v.idType === "ssn") factors.push({ t: "pass", txt: "SSN ✓" });
  else { factors.push({ t: "fail", txt: "SBA 7a requiere SSN y estatus migratorio" }); prob -= 70; }

  if (v.incomeType !== "ninguno") factors.push({ t: "pass", txt: "Tiene ingreso verificable ✓" });
  else { factors.push({ t: "fail", txt: "Se requieren declaraciones de impuestos" }); prob -= 50; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota — descalifica para SBA 7a" }); prob -= 80; }

  if (v.monthlyDeposits > 0) { min = 50000; max = 500000; }

  return {
    name: "SBA 7(a) — Préstamo Empresarial", color: "#2a5a1a", prob: clampProb(prob), min, max, factors,
    avatar: "Negocio con 2+ años, score 680+, SSN, tax returns 2 años, ciudadanía/residencia, sin bancarrota.",
    note: "Monto hasta $5M. Tasa prime + 2-3%. Plazo hasta 25 años. Proceso de 30-90 días. Requiere garantía personal.",
  };
}

function evalFixFlip(v: QualifierInputs): QualifierProduct {
  let prob = 100;
  const factors: QualifierFactor[] = [];
  const min = 50000;
  const max = 1000000;

  if (v.score >= 650) factors.push({ t: "pass", txt: `Score ${v.score} ✓` });
  else if (v.score >= 620) { factors.push({ t: "warn", txt: `Score ${v.score} — algunos lenders aceptan` }); prob -= 15; }
  else { factors.push({ t: "fail", txt: `Score ${v.score} — muy bajo para Fix & Flip` }); prob -= 60; }

  if (v.purpose === "inversion") factors.push({ t: "pass", txt: "Propósito de inversión ✓" });
  else { factors.push({ t: "warn", txt: "Fix & Flip es para propiedades de inversión" }); prob -= 30; }

  if (v.hasAssets === "si") factors.push({ t: "pass", txt: "Tiene activos — posible enganche ✓" });
  else { factors.push({ t: "warn", txt: "Se necesita 10-20% del precio de compra" }); prob -= 20; }

  if (v.bankruptcy === "si") { factors.push({ t: "fail", txt: "Bancarrota reciente" }); prob -= 50; }

  factors.push({ t: "pass", txt: "No requiere ingreso documentado extenso" });

  return {
    name: "Fix & Flip — Inversión en Propiedades", color: "#5a3a00", prob: clampProb(prob), min, max, factors,
    avatar: "Inversionista con score 620+, experiencia en proyectos de remodelación, 10-20% de enganche disponible.",
    note: "Plazo corto 6-18 meses. Tasa 8-14%. Aprobación en 7-21 días. El lender financia hasta 65-75% del ARV (valor después de reparación).",
  };
}

export function qualify(v: QualifierInputs): QualifierProduct[] {
  const products = [
    evalMCA(v), evalPersonalLoan(v), evalCreditCard(v),
    evalFHA(v), evalConvencional(v), evalDSCR(v),
    evalNoIncome(v), evalSBAMicro(v), evalSBA7a(v), evalFixFlip(v),
  ];
  return products.sort((a, b) => b.prob - a.prob);
}
