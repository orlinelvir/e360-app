import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Selector compartido de foto/documento (T1-4 del roadmap). Todas las
// pantallas que suben archivos (Revisor de Crédito, Documentos del cliente)
// deben importar esto en vez de reinventar el flujo de permisos.

export type PickedFile = {
  uri: string;
  name: string;
  type: string;
  // Tamaño en bytes, si el sistema lo reporta (para validar límites antes de subir).
  size?: number;
  // Solo presente si se pidió con { includeBase64: true } (ej. Revisor de
  // Crédito IA, que manda las imágenes como base64 en un body JSON).
  base64?: string;
};

type PickOptions = {
  includeBase64?: boolean;
};

type Source = "camera" | "library";

// Resuelve al origen elegido, o null si el usuario cancela el diálogo.
function askSource(): Promise<Source | null> {
  return new Promise((resolve) => {
    Alert.alert(
      "Agregar archivo",
      "¿De dónde quieres tomar la imagen?",
      [
        { text: "Cámara", onPress: () => resolve("camera") },
        { text: "Galería", onPress: () => resolve("library") },
        { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

function explainDeniedPermission(what: "la cámara" | "la galería") {
  Alert.alert(
    "Permiso necesario",
    `Para continuar necesitamos acceso a ${what}. Puedes activarlo en los Ajustes del teléfono.`,
    [
      { text: "Ahora no", style: "cancel" },
      { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
    ],
  );
}

function extensionToMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return "image/jpeg";
}

export async function pickDocumentOrPhoto(options: PickOptions = {}): Promise<PickedFile | null> {
  const source = await askSource();
  if (!source) return null;

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    quality: 0.8,
    base64: options.includeBase64 === true,
  };

  let result: ImagePicker.ImagePickerResult;

  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) explainDeniedPermission("la cámara");
      return null;
    }
    result = await ImagePicker.launchCameraAsync(pickerOptions);
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) explainDeniedPermission("la galería");
      return null;
    }
    result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  }

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? asset.uri.split("/").pop() ?? `foto-${Date.now()}.jpg`;
  const file: PickedFile = {
    uri: asset.uri,
    name,
    type: asset.mimeType ?? extensionToMime(name),
    size: asset.fileSize,
  };
  if (options.includeBase64 && asset.base64) file.base64 = asset.base64;
  return file;
}
