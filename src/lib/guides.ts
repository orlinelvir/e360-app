// Copia estática del catálogo GUIDES de lib/ai/guides.ts en e360-hub-1
// (mismo slug, title y description). Cada guía se abre vía redirección firmada
// en https://www.emprende360.biz/api/guides/<slug>.
export interface GuideEntry {
  slug: string;
  title: string;
  description: string;
}

export const GUIDES: GuideEntry[] = [
  {
    slug: 'mca',
    title: 'Guía MCA para Brokers',
    description: 'Detalles y requisitos para préstamos basados en ingresos (Merchant Cash Advance).',
  },
  {
    slug: 'sba',
    title: 'Guía Préstamos SBA',
    description: 'Proceso y requisitos para préstamos respaldados por la Small Business Administration.',
  },
  {
    slug: 'fondeo',
    title: 'Guía de Fondeo',
    description: 'Información general sobre opciones de fondeo empresarial.',
  },
  {
    slug: 'bienes-raices',
    title: 'Guía Financiamiento de Bienes Raíces',
    description: 'Requisitos para préstamos hipotecarios y de inversión inmobiliaria.',
  },
  {
    slug: 'registro-empresas',
    title: 'Guía Registro de Empresas',
    description: 'Paso a paso para la incorporación de LLCs y corporaciones.',
  },
  {
    slug: 'credito-empresarial',
    title: 'Cheatsheet Crédito Empresarial',
    description: 'Resumen rápido para construir y obtener crédito para negocios.',
  },
  {
    slug: 'credito-empresarial-script',
    title: 'Cheatsheet Crédito Empresarial y Script de Ventas',
    description: 'Resumen rápido de crédito empresarial más guión de venta sugerido.',
  },
  {
    slug: 'done-for-you',
    title: 'Guía Done For You',
    description: 'Servicios gestionados directamente por el equipo interno.',
  },
  {
    slug: 'proceso-broker-credito',
    title: 'Proceso del Broker de Crédito',
    description: 'Flujo de trabajo para brokers de crédito empresarial.',
  },
  {
    slug: 'reparacion-credito-clientes',
    title: 'Reparación de Crédito para Clientes',
    description: 'Detalles del servicio de reparación de crédito para clientes.',
  },
  {
    slug: 'precios-reparacion-credito',
    title: 'Guía de Precios — Reparación de Crédito',
    description: 'Tabla de precios y comisiones para reparación de crédito.',
  },
  {
    slug: 'config-ghl-pipelines',
    title: 'Guía Configuración GHL Pipelines',
    description: 'Instrucciones para configurar los embudos en StartPoint CRM (GoHighLevel).',
  },
  {
    slug: 'primeros-compradores',
    title: 'Programas Primeros Compradores (50 Estados)',
    description: 'Programas de asistencia para primeros compradores de vivienda a nivel nacional.',
  },
  {
    slug: 'lead-flow',
    title: 'Cheatsheet Lead Flow',
    description: 'Diagrama de flujo de cómo manejar y procesar leads entrantes.',
  },
  {
    slug: 'consolidacion-synchrony',
    title: 'Cheatsheet Consolidación Synchrony',
    description: 'Detalles sobre opciones de consolidación de deudas con Synchrony.',
  },
  {
    slug: 'prestamos-empresariales',
    title: 'Cheatsheet Préstamos Empresariales',
    description: 'Resumen rápido de opciones de préstamos empresariales.',
  },
  {
    slug: 'onboarding-broker',
    title: 'Guía de Onboarding E360',
    description: 'Paso a paso exclusivo para brokers: acceso, perfil, el CRM completo, calendarios, landing pages y formularios.',
  },
  {
    slug: 'servicios-adicionales',
    title: 'Guía de Servicios Adicionales E360',
    description: 'Los 3 add-ons premium del CRM: número de teléfono dedicado ($30/mes), WhatsApp API oficial ($10/mes) y Prospecting B2B ($75/mes) — precios, beneficios y a quién recomendarlos.',
  },
  {
    slug: 'license-information',
    title: 'Información de Licencia E360',
    description: 'Documento oficial de licencia y cumplimiento de Emprende 360 — tenlo a la mano para consultas de tus clientes.',
  },
];
