import { GoogleOneTapSignIn } from "react-native-nitro-google-signin";

// Mismo Web Client ID que ya usa Google Sign-In en el Hub web (Firebase
// Console → Authentication → Sign-in method → Google → Web SDK
// configuration) — un solo proveedor de Google para los dos.
GoogleOneTapSignIn.configure({
  webClientId: "355923708106-861cc6io9c0gqvttq8a24samco7dntaj.apps.googleusercontent.com",
});
