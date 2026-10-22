// Copia liviana (solo id + título) del catálogo real en
// app/hub/broker-onboarding/data/services.ts del Hub web — "Reparación de
// Crédito" se excluye a propósito: tiene su propio flujo de admisión (SSN
// cifrado, comprobante de pago, push a Credit Repair Cloud) que todavía no
// existe en la app móvil, igual que en el Hub web (CreditRepairIntakeModal
// aparte de AdmisionFormModal).
export interface ServiceOption {
  id: string;
  title: string;
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "business-loan", title: "Préstamo de Negocio (< 680 FICO / MCA)" },
  { id: "business-loan-conventional", title: "Préstamo Empresarial Convencional (> 700 FICO)" },
  { id: "personal-loan", title: "Préstamo Personal" },
  { id: "business-credit-cards", title: "Tarjetas de Crédito de Negocio" },
  { id: "mortgage-loan", title: "Préstamo Hipotecario / Bienes Raíces" },
  { id: "adios-deudas", title: "AdiosDeudas — Negociación de Deudas" },
  { id: "incorporation", title: "Registro de Compañía" },
  { id: "payroll", title: "Servicios de Nómina" },
  { id: "pos-services", title: "Servicios de POS" },
  { id: "auto-insurance", title: "Seguro de Auto Personal" },
  { id: "commercial-auto-insurance", title: "Seguro Comercial de Auto & Trucking" },
  { id: "home-insurance", title: "Seguro de Casa (Homeowners)" },
  { id: "business-insurance", title: "Seguro de Negocio (General Liability)" },
  { id: "workers-comp", title: "Seguro de Compensación de Trabajadores" },
  { id: "immigration-services", title: "Servicios de Inmigración" },
  { id: "tax-preparation", title: "Preparación de Impuestos" },
  { id: "life-insurance", title: "Seguro de Vida" },
  { id: "health-insurance", title: "Membresía de Seguro Médico" },
];
