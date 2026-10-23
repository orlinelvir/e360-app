// Copia liviana de lib/support/ticket-categories.ts del Hub web — mismas 8
// categorías alineadas a los departamentos reales de Contacto Directo.
export interface TicketCategoryOption {
  id: string;
  label: string;
}

export const TICKET_CATEGORIES: TicketCategoryOption[] = [
  { id: "general", label: "Soporte General / Plataforma" },
  { id: "ghl_crm", label: "CRM StartPoint — Configuración/Errores" },
  { id: "commission", label: "Comisiones y Pagos" },
  { id: "underwriting", label: "Estatus de Aplicación / Underwriting" },
  { id: "credit_repair", label: "Reparación de Crédito" },
  { id: "onboarding", label: "Onboarding / Nuevo Broker" },
  { id: "marketing", label: "Marketing y Contenido" },
  { id: "corporate_tax", label: "Taxes / Inmigración / Corporativo" },
];

export function getTicketCategoryLabel(id: string): string {
  return TICKET_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  in_progress: "En Progreso",
  resolved: "Resuelto",
};

export const TICKET_STATUS_COLOR: Record<string, string> = {
  open: "#f87171",
  in_progress: "#fbbf24",
  resolved: "#34d399",
};
