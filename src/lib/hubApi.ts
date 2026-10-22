import { auth, HUB_API_BASE_URL } from "@/config/firebase";

// Para las pantallas de Torre de Control (Admin/Staff): llama directo a las
// rutas /api/admin/* que ya existen y están probadas en el Hub web, en vez
// de reimplementar esa lógica de servidor en la app móvil.
export async function hubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // FormData (ej. multipart de Solicitudes) necesita que fetch fije su propio
  // Content-Type con el boundary — si lo forzamos a application/json aquí,
  // el servidor nunca podría parsear el body como form-data.
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(`${HUB_API_BASE_URL}${path}`, { ...init, headers });
}
