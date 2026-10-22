// Copia mínima de lib/services/case-status.ts del Hub web — misma regla de
// derivación (status crudo -> reviewStatus legible) para no tener que
// duplicar toda la lógica de servidor en el cliente móvil.
export type ReviewStatus = "pending_docs" | "in_review" | "approved" | "rejected" | "funded";

export function deriveReviewStatus(status?: string): ReviewStatus {
  if (status === "approved" || status === "rejected" || status === "funded" || status === "pending_docs") {
    return status;
  }
  if (status === "in_progress" || status === "in_review") {
    return "in_review";
  }
  return "pending_docs";
}

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending_docs: "Pendiente de Documentos",
  in_review: "En Revisión",
  approved: "Aprobado",
  rejected: "Declinado",
  funded: "Fondeado / Pagado",
};

export const REVIEW_STATUS_COLOR: Record<ReviewStatus, string> = {
  pending_docs: "#fbbf24",
  in_review: "#60a5fa",
  approved: "#22d3ee",
  rejected: "#9ca3af",
  funded: "#34d399",
};
