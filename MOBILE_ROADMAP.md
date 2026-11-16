# E360 Hub Mobile — Hoja de Ruta de Paridad (para ejecutar con varias IAs)

Este documento es para despachar tareas a OpenCode, Antigravity/Gemini, u otra IA de código — una tarea a la vez, copiando el bloque completo de la tarea **más la sección 0 (Convenciones Compartidas)** en cada prompt, porque la IA que la ejecute no tiene memoria de las demás tareas ni de esta conversación.

**Estado verificado al escribir esto (16 nov 2026)**: `e360-mobile` tiene 8 commits reales, 5 pantallas (`login`, `index`=Clientes, `solicitudes`, `tickets`, `calificador`, `admin`), autenticación y 4 de las 5 pantallas ya pegan al mismo Firebase/backend que el Hub web (`e360-hub-1`). Nada de esto es una promesa — cada contrato de API abajo fue copiado de la ruta real, no inferido del nombre.

---

## 0. Convenciones Compartidas (pegar en TODAS las tareas)

**Cliente HTTP único**: `hubFetch(path, init)` de `@/lib/hubApi` — agrega `Authorization: Bearer <idToken>` solo. Para subir archivos, pasa `FormData` como `body` y NUNCA fijes `Content-Type` a mano (hubFetch detecta FormData y deja que `fetch` ponga su propio boundary).

**Forma de respuesta del backend** (85 rutas, consistente): listas → `{ <plural>: [...] }`; creación/acción → `{ success: true, ... }`; error → `{ error: string }` con código HTTP (401 = no autenticado, 403 = sin permiso o paywall, 400 = validación, 404 = no encontrado, 500 = error de servidor).

**Patrón de pantalla de referencia** — copia la estructura literal de estos 2 archivos ya existentes, no inventes otra:
- Lista + formulario modal: `src/app/(tabs)/tickets.tsx` (SafeAreaView edges=['top'], FlatList con RefreshControl, Modal tipo bottom-sheet con KeyboardAvoidingView, estilos con StyleSheet.create al final, todos los colores desde `Colors.dark.*`, nunca hex sueltos).
- Pantalla con múltiples fetch + tarjetas de resumen: `src/app/(tabs)/admin.tsx` (Promise.all de varios hubFetch, ScrollView con RefreshControl, tarjetas con badge de estado).

**Pantallas empujadas (push), fuera de `(tabs)/`**: el `_layout.tsx` raíz es un `<Stack screenOptions={{headerShown:false}}>` con solo 2 rutas declaradas (`(tabs)` y `login`) — Expo Router registra CUALQUIER archivo nuevo bajo `src/app/` automáticamente como pantalla de stack, sin tocar ese archivo. Como `headerShown` es `false` globalmente, toda pantalla empujada debe traer su propio botón de regreso a mano: fila superior con `TouchableOpacity onPress={() => router.back()}` + `<Ionicons name="chevron-back" size={24} color={Colors.dark.text} />`, mismo patrón en todas.

**Nunca hacer**: `fetch()` crudo a `/api/*` fuera de `hubFetch`; leer Firestore directo con el SDK de cliente (`collection`/`getDocs`) fuera de `AuthContext.tsx`; colores hex fuera de `theme.ts`; tocar `src/app/(tabs)/_layout.tsx`, `src/lib/hubApi.ts`, `src/constants/theme.ts`, `src/context/AuthContext.tsx`, `app.json`, `eas.json` — salvo que la tarea lo diga explícitamente; agregar una dependencia npm nueva no listada en la tarea.

**Definición de terminado (todas las tareas)**: `npx tsc --noEmit` limpio, `npx expo lint` limpio, la pantalla sigue el patrón de referencia citado, maneja los 3 estados (cargando/error/vacío) igual que `tickets.tsx`.

---

## Tier 0 — Solo tú, no delegable a ninguna IA

- [ ] Crear cuenta Apple Developer Program ($99/año) y Google Play Console, si vas a publicar en tienda pública alguna vez. Para el build interno/TestFlight de mediados de diciembre no es obligatorio.
- [ ] Decidir el identificador real de marca (ej. `com.emprende360.hub` o `biz.emprende360.app`) para reemplazar `com.mycompany.e360app`.

---

## Tier 1 — Fundación (en orden, antes que cualquier tarea de Tier 3)

### T1-1 — Rebrand del bundle identifier
**Archivos**: editar `app.json` (`ios.bundleIdentifier`, `android.package`). **No tocar** `eas.json`.
Después de este cambio, el `google-services.json` actual queda inválido (el `package_name` ya no coincide) — regenerarlo desde la consola de Firebase es una acción humana, no de código; déjalo marcado como pendiente en el commit.
**Bloquea**: T4 (build).

### T1-2 — Backend: construir `GET /api/broker/clients`
**Repo**: `e360-hub-1`, no `e360-mobile`.
**Archivo nuevo**: `app/api/broker/clients/route.ts`.
**Contrato**: `verifyAuthToken` → 401 si falta. Reemplaza la lectura directa de Firestore que hoy hace `getBrokerClients()` en `lib/services/broker-service.ts:132-150` (`brokers/{uid}/clients`, ordenado por `createdAt desc`) pero vía Admin SDK, respondiendo `{ clients: ClientLeadData[] }` — la forma exacta de `ClientLeadData` está en `lib/services/broker-service.ts:35-68` del mismo repo (campos: `id, name, email, phone, serviceId, serviceName, amount, estimatedCommission, stage, createdAt, lastActivity, status, syncStatus, notes, source`). Excluir del resultado cualquier doc con `source === "ghl_sync"` (son contactos crudos sincronizados de GHL, no solicitudes reales — mismo criterio que ya usan `/api/admin/metrics` y `/api/admin/staff-activity`).
**Bloquea**: A1 (Clientes en móvil).

### T1-3 — Navegación: 2 pestañas nuevas
**Archivo**: editar `src/app/(tabs)/_layout.tsx` — agregar 2 entradas `<Tabs.Screen>` nuevas, **sin tocar las 5 existentes**:
- `name="oficina"`, título "Oficina Virtual", ícono Ionicons `"briefcase"`.
- `name="mas"`, título "Más", ícono Ionicons `"ellipsis-horizontal"`.

**Archivos nuevos (landing simples, cada uno es solo un menú de tarjetas que empuja a las pantallas de Tier 3 — no construyen nada todavía)**:
- `src/app/(tabs)/oficina.tsx` — ver A-OFICINA-0 abajo, es su propia tarea.
- `src/app/(tabs)/mas.tsx` — menú con 3-4 tarjetas: "Mi Perfil" → push `/perfil`, "Recursos" → push `/recursos`, "Revisor de Crédito IA" → push `/revisor`, y si `profile.role !== 'broker'`: "Mis Horas" → push `/horas`. Sin fetch propio, solo navegación — patrón visual: copiar las `TouchableOpacity` tipo tarjeta de `tickets.tsx` pero sin badge de estado.

### T1-4 — Nueva dependencia compartida: selector de imagen/cámara
Necesaria para A-REVISOR (foto de reporte de crédito) y A-CLIENTE-DOC (subir documento). Resolver UNA vez aquí, no por tarea.
**Acción**: `npx expo install expo-image-picker` (gestiona permisos de cámara/galería, compatible con SDK 57 por construcción). No agregar ninguna otra librería de cámara.
**Archivo nuevo**: `src/lib/pickFile.ts` — una función `pickDocumentOrPhoto(): Promise<{ uri: string; name: string; type: string } | null>` que ofrece elegir entre cámara y galería (usa `ImagePicker.launchCameraAsync` / `launchImageLibraryAsync`), para que todas las tareas de subida de archivo la importen en vez de reinventar el flujo de permisos cada una.

---

## Tier 2 — Huecos de backend puntuales (antes de A-RECURSOS y A-OFICINA-DASHBOARD)

### T2-1 — Confirmar catálogo de Recursos
**Verificado, no hace falta ruta nueva**: `lib/ai/guides.ts` en `e360-hub-1` exporta un arreglo estático `GUIDES` (slug, title, description) — no hay endpoint de lista. El patrón ya establecido en `e360-mobile` (`src/lib/services.ts`, `src/lib/caseStatus.ts`) es copiar catálogos estáticos así, con un comentario que diga de qué archivo del Hub web viene. La tarea A-RECURSOS de abajo ya asume este catálogo copiado — no se necesita trabajo de backend aparte.

### T2-2 — Dashboard de Oficina Virtual: sin endpoint agregador
**Verificado**: no existe una ruta `/api/tax-office/dashboard`. El Hub web calcula sus KPIs en el cliente (`TaxOfficeSection.tsx`, `useMemo`) a partir de `cases` + `invoices` ya traídos por separado. La tarea C-DASHBOARD de abajo ya está escrita para hacer lo mismo (2 fetch, no 10) — alcance reducido a propósito para móvil, no es un hueco que haya que llenar.

---

## Tier 3, Grupo A — Día a día del broker

### A1 — Clientes: lista (reemplaza index.tsx actual)
**Depende de**: T1-2.
**Archivo**: editar `src/app/(tabs)/index.tsx` — cambiar la fuente de datos de Firestore directo a `hubFetch('/api/broker/clients')` → `{ clients: ClientLeadData[] }`. Mantener la tarjeta visual actual tal cual está (nombre, servicio, monto, badge de estado vía `deriveReviewStatus`/`REVIEW_STATUS_COLOR` de `src/lib/caseStatus.ts`, que YA existe). Agregar un botón "Ver por estado" que empuje a `/clientes-agrupado` (A2) y que cada tarjeta, al tocarla, empuje a `/cliente/[id]` (A3) pasando el `id`.
**No hacer**: drag-and-drop ni cambio de etapa — el broker no tiene permiso de mover su propio caso de estado (`/api/broker/clients/edit` solo permite corregir name/email/phone/amount/notes, y solo mientras el caso sigue en `pending_docs`/`in_review`; el estado lo cambia staff).

### A2 — Clientes agrupados por estado (vista, no tablero movible)
**Archivo nuevo**: `src/app/clientes-agrupado.tsx`. Mismos datos que A1 (puede recibir la lista ya cargada por parámetro de navegación, o volver a pedir `/api/broker/clients`), agrupados visualmente por `deriveReviewStatus(c.status)` en secciones con `SectionList`, cada sección con el color de `REVIEW_STATUS_COLOR`. Solo lectura.

### A3 — Detalle de cliente + notas
**Archivo nuevo**: `src/app/cliente/[id].tsx`.
**Contrato**: `GET /api/broker/clients/notes?clientId=<id>` → `{ notes: CaseNote[] }` (categoría siempre `"broker"` en esta vista — las notas de staff nunca llegan aquí). No existe ruta de creación de notas para broker en el código verificado hoy — si al ejecutar esta tarea no se confirma un `POST` real en `e360-hub-1`, la pantalla debe ser de **solo lectura de notas** (mostrar, no agregar) hasta que se construya esa ruta aparte; no inventar un endpoint.
También mostrar los campos editables vía `PATCH /api/broker/clients/edit` (body: `{clientId, name?, email?, phone?, amount?, notes?}`, solo si `reviewStatus` es `pending_docs` o `in_review` — si el backend responde 400 con el mensaje "Este caso ya fue revisado...", mostrarlo tal cual, no como error genérico) y un botón a A4.

### A4 — Documentos del cliente
**Depende de**: T1-4.
**Archivo nuevo**: `src/app/cliente/[id]/documentos.tsx`.
**Contrato**: `GET /api/broker/clients/documents?clientId=<id>` → `{ documents: [{..., downloadUrl}] }` (URL firmada, expira en 15 min — no cachear el link). `POST` multipart (`FormData` con `clientId` + `file`) al mismo path → `{ success: true, documentId }`. Tipos permitidos: `image/jpeg, image/png, image/webp, application/pdf`, máx 8MB (validar en cliente antes de subir para no gastar la subida completa en un archivo que el servidor va a rechazar).

### A5 — Mi Perfil: resumen
**Archivo nuevo**: `src/app/perfil/index.tsx` (reemplaza/extiende lo que hoy vive implícito en `AuthContext`). `GET /api/broker/profile` → `{ profile: BrokerProfileData }`. Mostrar: displayName, email, tier, brokerId, ciudad/estado, bio. Botones a A6/A7/A8.

### A6 — Mi Perfil: editar
**Archivo nuevo**: `src/app/perfil/editar.tsx`. `POST /api/broker/profile`, body con cualquiera de: `displayName, businessName, phone, whatsapp, city, state, nmlsId, licenseNumber, bio, specialties (array), referralSlug`. Solo mandar los campos que el usuario realmente cambió (el backend solo actualiza claves presentes en el body).

### A7 — Mi Perfil: Subcuenta CRM (GHL)
**Archivo nuevo**: `src/app/perfil/crm.tsx`. `POST /api/broker/ghl-credentials`, body `{ghlLocationId, ghlApiKey}` → `{success:true}`. **No hay GET dedicado** — el estado de conexión (`ghlConnected`) ya viene incluido en la respuesta de A5 (`profile.ghlConnected`/`profile.ghlLocationId`); no se construya un fetch nuevo para esto, reusar lo que A5 ya cargó.

### A8 — Mi Perfil: Mi Contrato (autorreporte)
**Archivo nuevo**: `src/app/perfil/contrato.tsx`. Texto explicativo de la garantía de devolución (copiar el contenido en español ya usado en el Hub web, `MiPerfilSection.tsx`, sección "Mi Contrato") + botón "Ya firmé" → `POST /api/broker/profile` con `{contractSignedSelfReported: true}`. Mostrar como informativo/no-oficial si `profile.contractSignedAt` (la firma real, confirmada por staff/webhook) está vacío.

### A9 — Recursos (biblioteca de guías)
**Depende de**: T2-1.
**Archivo nuevo**: `src/lib/guides.ts` — copia estática del catálogo `GUIDES` de `lib/ai/guides.ts` en `e360-hub-1` (mismo slug/title/description, con comentario de origen, mismo patrón que `src/lib/services.ts`).
**Archivo nuevo**: `src/app/(tabs)/recursos.tsx` *(nota: este SÍ se registra como ruta hija de `/recursos` desde "Más"; no necesita entrada en Tabs — vive fuera de `(tabs)/_layout.tsx`, el nombre de carpeta es solo organizativo)* — en realidad crear como `src/app/recursos.tsx` (fuera de `(tabs)/`, empujado desde T1-3). Lista de tarjetas; al tocar una, abrir `https://www.emprende360.biz/api/guides/<slug>` con `expo-web-browser` (`WebBrowser.openBrowserAsync`, NO `hubFetch` — es una redirección a un PDF firmado, se abre en el navegador del sistema, no se descarga vía fetch).

### A10 — Revisor de Crédito IA (cámara)
**Depende de**: T1-4.
**Archivo nuevo**: `src/app/revisor/index.tsx`. Botón "Tomar foto" / "Elegir de galería" vía `pickFile.ts` (múltiples páginas — permitir elegir varias fotos en serie, acumular en un arreglo). Al enviar: convertir cada imagen a base64, `POST /api/credit-repair/analyze-report` con body JSON `{ images: [{mimeType, data(base64 sin prefijo data:)}] }` (máx 70 imágenes — validar antes de mandar). **Manejar explícitamente**: `429` con `code:"rate_limited"` (máx 8 análisis/hora) → mostrar el mensaje literal del backend (ya trae los minutos de espera calculados); `502` con `code` variable → mensaje genérico de reintentar. La llamada puede tardar hasta 180s (`maxDuration`) — mostrar un indicador de carga largo, no un spinner que parezca colgado a los 5s.
**No hacer**: no implementar extracción de texto de PDF en el cliente (el Hub web sí lo hace para PDFs pegados como texto) — el v1 móvil es solo-cámara/imágenes.

### A11 — Revisor de Crédito: resultados
**Archivo nuevo**: `src/app/revisor/resultado.tsx`. Renderiza la respuesta `{ success: true, analysis: {scores: [...], problemas: [...], resumen_para_el_broker: string}, notes: string[] }` de A10. Mostrar `notes` (si hay) como avisos amarillos arriba (ej. "reporte muy largo, se analizó solo la primera parte").

---

## Tier 3, Grupo B — Staff/Admin interno

Todas dependen de T1-3 en cuanto a navegación — `admin.tsx` existente se convierte de "pantalla única" a "menú con tarjetas", cada tarjeta empuja a una de estas:

### B1 — Admin: reconvertir admin.tsx en menú
**Archivo**: editar `src/app/(tabs)/admin.tsx` — mover el contenido actual (resumen de tickets+casos) a una nueva B2, y dejar `admin.tsx` como un menú de tarjetas: Resumen, Casos, Brokers, Tickets, Equipo & Roles, Catálogo de Servicios, Subcuentas GHL, Métricas, Actividad del Staff, Cola de Sincronización, Nómina — cada una empuja a `/admin/<nombre>`.

### B2 — Admin: Resumen
**Archivo nuevo**: `src/app/admin/resumen.tsx` — exactamente el contenido que hoy tiene `admin.tsx` (ya funciona, solo se mueve de archivo).

### B3 — Admin: Casos (Master Feed)
**Archivo nuevo**: `src/app/admin/casos.tsx`. `GET /api/admin/cases` (ya usado hoy en B2, reutilizar la forma de respuesta). Agregar filtro de búsqueda simple por nombre/broker (cliente-side, sin parámetros nuevos al backend).

### B4 — Admin: Roster de Brokers
**Archivo nuevo**: `src/app/admin/brokers.tsx`. `GET /api/admin/brokers` → `{ brokers: [...], total }`. Campos reales por broker: `uid, displayName, email, phone, tier, role, ghlConnected, packagePaid, referralEarnings, brokerId, totalClients, totalVolume, pendingSyncCount`. Mostrar como lista con búsqueda local; sin acciones de escritura en v1 (solo lectura).

### B5 — Admin: Tickets de Brokers
**Archivo nuevo**: `src/app/admin/tickets.tsx`. `GET /api/admin/tickets` → `{ tickets: [...with brokerName, possibly attachmentUrl], total }`. `PATCH /api/admin/tickets`, body `{brokerId, ticketId, status}` → `{success:true}` (status: `"open"|"in_progress"|"resolved"`).

### B6 — Admin: Equipo & Roles
**Archivo nuevo**: `src/app/admin/roles.tsx`. `GET /api/admin/roles` → `{ teamMembers: [...], roleDefinitions: [...] }`. `POST /api/admin/roles`, body `{targetUid, role, contractType?, hourlyRateUSD?, weeklyHoursExpected?, contractNotes?}` → `{success:true}`. Selector de rol simple (los `roleDefinitions.id` válidos vienen en la respuesta del GET, no hardcodear la lista).

### B7 — Admin: Catálogo de Servicios
**Archivo nuevo**: `src/app/admin/servicios.tsx`. `GET /api/admin/services` → `{ services: [...] }` (sin el ícono, ya excluido por el backend). `PATCH` body `{serviceId, override: {...}}` → `{success:true}`. v1: solo editar título/descripción del override, no todos los campos posibles.

### B8 — Admin: Subcuentas GHL
**Archivo nuevo**: `src/app/admin/subcuentas.tsx`. `GET /api/admin/locations` → `{ locations: [{id,name,state,country,timezone,email,phone}], total }`. Solo lectura.

### B9 — Admin: Métricas Globales
**Archivo nuevo**: `src/app/admin/metricas.tsx`. `GET /api/admin/metrics` → `{ metrics: {totalBrokers, connectedBrokers, totalLeads, totalVolume, estimatedCommissions, syncHealth:{synced,failed}, clusterStats:{<cluster>:{count,volume}}} }`. Tarjetas de KPI + lista simple de clusterStats.

### B10 — Admin: Actividad del Staff
**Archivo nuevo**: `src/app/admin/actividad.tsx`. `GET /api/admin/staff-activity?days=7|30|90` → `{ windowDays, staff: [{uid,name,email,role,lastLogin,caseNotes,statusChanges,ticketReplies}], backlogByCluster: {<cluster>:{pendingDocs,inReview,staleCases:[{brokerId,clientId,name,ageDays}]}} }`. Selector de ventana de días (chips 7/30/90) + lista ordenada (ya viene ordenada del backend) + sección de backlog por cluster.

### B11 — Admin: Cola de Sincronización
**Archivo nuevo**: `src/app/admin/sincronizacion.tsx`. `GET /api/admin/failed-sync` → `{ leads: [...], total }`. `POST /api/admin/retry-sync` — **confirmar el body exacto leyendo `app/api/admin/retry-sync/route.ts` antes de implementar el botón de reintento** (no verificado en esta auditoría); si no se puede confirmar, dejar la pantalla de solo lectura y el botón deshabilitado con una nota "pendiente de confirmar contrato".

### B12 — Nómina (admin)
**Archivo nuevo**: `src/app/admin/nomina.tsx`. `GET /api/admin/payroll?periodStart=YYYY-MM-DD&periodEnd=YYYY-MM-DD` → `{ rows: [{staffUid, staffName, periodStart, periodEnd, hoursLogged, hourlyRate, expectedPay, actualPaid?, paidAt?, notes?}] }`. `POST` mismo path, body `{staffUid, periodStart, periodEnd, actualPaid, notes?}` → `{ record }`. Selector de rango de fechas (2 date pickers) + tabla/lista con variación (actualPaid - expectedPay) coloreada verde/roja.

### B13 — Mis Horas (staff)
**Archivo nuevo**: `src/app/horas.tsx`. `GET /api/staff/time-entries` → `{ entries: [{id,date,hoursWorked,note,createdAt}], contractType?, hourlyRateUSD?, weeklyHoursExpected? }`. `POST` mismo path, body `{date, hoursWorked, note?}` → `{ entry }`. Validar `hoursWorked` entre 0.25 y 24 antes de mandar (el backend rechaza >24). Mostrar tarjeta de estimado semanal igual que `MisHorasSection.tsx` del Hub web (horas de la semana × tarifa, solo si `contractType === "hourly"`).

---

## Tier 3, Grupo C — Oficina Virtual (Tax Office)

**Regla transversal a TODAS estas tareas**: toda respuesta `403` con `error` que contenga el texto `"Oficina Virtual E360 no está activa"` debe mostrarse como una pantalla de upsell (ícono + texto "Esta función requiere Oficina Virtual E360 activa" + nada de formulario), nunca como un error rojo genérico.

### C0 — Oficina: landing + navegación
**Archivo nuevo**: `src/app/(tabs)/oficina.tsx`. Un solo `GET /api/tax-office/cases` para detectar early si hay 403-paywall (si lo hay, mostrar upsell de una vez y no renderizar el menú). Si no hay paywall: menú de tarjetas → Dashboard, Casos, Clientes, Workflow, Tareas, Citas, Facturación, Comisiones, Formularios, Automatizaciones.

### C1 — Oficina: Dashboard (alcance reducido para móvil)
**Archivo nuevo**: `src/app/oficina/dashboard.tsx`. Solo 2 fetch (no los 10 que usa la versión web): `GET /api/tax-office/cases` → `{cases: TaxCase[]}` y `GET /api/tax-office/invoices` → `{invoices: TaxInvoice[]}`. Calcular en cliente: total casos, volumen total (`agreedFee` sumado), facturado (`amount` donde `status==='paid'`), pendiente de cobro (`status==='sent'`). **No portar** la fila de Notifications/Submitted-documents/Automation-activity de la versión web — no-objetivo explícito para v1 móvil.

### C2 — Oficina: Casos
**Archivo nuevo**: `src/app/oficina/casos.tsx`. `GET /api/tax-office/cases` → `{cases: TaxCase[]}` (campos: `id,clientName,clientEmail,clientPhone,serviceType,taxYear,agreedFee,stage,bankProduct?,bankPartner?,refundAdvanceRequested?,documentsCount,deadline?,notes?,assignedPreparer?`). `POST` mismo path crea caso. `PATCH /api/tax-office/cases/[caseId]`, body `{stage}` para avanzar etapa (valores: `new,docs_pending,in_review,ready_to_file,transmitted,accepted,rejected`).

### C3 — Oficina: Clientes
**Archivo nuevo**: `src/app/oficina/clientes.tsx`. `GET/POST /api/tax-office/clients` → `{clients: TaxClient[]}` / `{client}`. Campos: `id,name,email,phone,status(lead|active|pending|waiting_docs|in_review|completed|inactive|archived),notes?`. `PATCH /api/tax-office/clients/[clientId]` para cambiar `status`.

### C4 — Oficina: Workflow (solo lectura del pipeline, sin drag-and-drop)
**Archivo nuevo**: `src/app/oficina/workflow.tsx`. `GET /api/tax-office/pipelines` → `{pipelines: TaxPipeline[]}`, `GET /api/tax-office/leads` → `{leads: TaxLead[]}`. Vista de columnas por etapa (`SectionList` horizontal o tabs por etapa) — **no-objetivo v1**: reordenar por arrastre (el equivalente táctil es mucho más trabajo de UI; dejar para una iteración posterior). Para mover un lead de etapa, usar un botón "Mover a..." con un selector, llamando `PATCH /api/tax-office/leads/[leadId]` con `{stageId}`.

### C5 — Oficina: Tareas
**Archivo nuevo**: `src/app/oficina/tareas.tsx`. `GET/POST /api/tax-office/tasks` → `{tasks: TaxTask[]}` / `{task}`. Campos: `id,title,description?,dueDate?,priority(low|medium|high),status(to_do|in_progress|completed),relatedClientId?`. `PATCH /api/tax-office/tasks/[taskId]` para `status`.

### C6 — Oficina: Citas
**Archivo nuevo**: `src/app/oficina/citas.tsx`. `GET/POST /api/tax-office/appointments` → `{appointments: TaxAppointment[]}` / `{appointment}`. Campos: `id,title,type,dateTime(ISO),durationMinutes,relatedClientId?,location?,meetingIntegration(none|zoom|google_meet|phone),label?`. Lista simple ordenada por fecha — **no-objetivo v1**: vista de calendario mensual (la versión web la tiene; alcance reducido a lista).

### C7 — Oficina: Facturación
**Archivo nuevo**: `src/app/oficina/facturas.tsx`. `GET/POST /api/tax-office/invoices` → `{invoices: TaxInvoice[]}` / `{invoice}`. Campos: `id,invoiceNumber,clientName,clientEmail,amount,description?,dueDate,status(draft|sent|paid|failed|refunded|cancelled),paymentMethod(refund_deduction|card|zelle|cash),caseId?`. `PATCH /api/tax-office/invoices/[invoiceId]` body `{status}`.

### C8 — Oficina: Comisiones
**Archivo nuevo**: `src/app/oficina/comisiones.tsx`. `GET /api/tax-office/commissions` → `{commissions: TaxCommissionItem[]}` (campos: `preparerName,preparerEmail,totalReturns,grossVolume,splitPercentage,e360FeeDeduction,netCommission,status(pending|paid)`). Solo lectura v1 — **no-objetivo**: crear comisión nueva ni exportar CSV/PDF desde el teléfono.

### C9 — Oficina: Formularios (solo lista + envíos, sin constructor)
**Archivo nuevo**: `src/app/oficina/formularios.tsx`. `GET /api/tax-office/forms` → `{forms: TaxFormTemplate[]}` (campos relevantes: `id,name,status(draft|published),version,secureToken`). Por formulario publicado, botón "Copiar link público" (`https://www.emprende360.biz/tax-forms/<secureToken>`, usar `Clipboard` de Expo). **No-objetivo explícito v1**: el constructor de formularios de arrastrar-y-soltar (`TaxOfficeFormBuilder.tsx` en la web) — es desktop-only por diseño, no portar.

### C10 — Oficina: Automatizaciones (solo lectura)
**Archivo nuevo**: `src/app/oficina/automatizaciones.tsx`. `GET /api/tax-office/automations` → `{automations: TaxAutomation[]}` (campos: `id,name,status(active|draft|paused),triggerType,actionType`). `PATCH /api/tax-office/automations/[automationId]` body `{status}` para pausar/activar. **No-objetivo v1**: crear una automatización nueva desde el teléfono (formulario de trigger/acción es complejo; dejar para después).

---

## Tier 4 — Build de distribución interna

### T4-1 — Perfil de build interno en EAS
**Depende de**: T1-1 (bundle id ya cambiado) + que un lote representativo de Tier 3 esté mergeado.
Usar el perfil `build.preview` que ya existe en `eas.json` (`internal` distribution) — no crear uno nuevo. Comando: `eas build --profile preview --platform ios` (o `android`). **No tocar** `submit.production` — eso es para tienda pública, fuera de alcance de este tier.
Antes de correr esto: confirmar que `google-services.json` ya fue regenerado con el nuevo `package_name` (acción humana de T1-1), o el build de Android fallará en autenticación de Firebase/Google Sign-In en silencio.

---

## Verificación después de CADA lote de tareas (hazlo tú o pídeselo a una sesión de Claude aparte — no a la misma IA que escribió el lote)

```bash
cd e360-mobile
npx tsc --noEmit
npx expo lint
npx expo-doctor

# Fugas de patrón — cualquier resultado aquí es una tarea mal ejecutada:
grep -rn "collection(db\|getDocs(\|getFirestore" src/app src/lib --include="*.tsx" --include="*.ts" | grep -v "src/context/AuthContext.tsx"
grep -rn "fetch(\`\${HUB_API_BASE_URL}\|fetch('/api/\|fetch(\"/api/" src/app src/lib | grep -v "src/lib/hubApi.ts"
grep -rEn "#[0-9a-fA-F]{6}" src/app src/lib --include="*.tsx" | grep -v "theme.ts"
```

Si cualquiera de los 3 `grep` de fugas devuelve algo, esa tarea se re-despacha con la instrucción corregida — no se parchea a mano en silencio, porque la próxima tarea de otra IA va a repetir el mismo error si no se entiende por qué pasó.
