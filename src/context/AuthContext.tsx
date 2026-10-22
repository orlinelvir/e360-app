import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleOneTapSignIn, isNoSavedCredentialFoundResponse, isSuccessResponse } from "react-native-nitro-google-signin";
import { auth, db } from "@/config/firebase";
import "@/config/googleSignIn";

// Mismo documento brokers/{uid} que usa el Hub web — mismos roles
// (admin, support_agent, underwriter_mca, specialist_*, sales_agent,
// onboarding_member, broker). Ver lib/roles.ts en el repo del Hub.
export interface BrokerProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  tier?: string;
}

interface AuthContextType {
  user: User | null;
  profile: BrokerProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithEmail: async () => {},
  loginWithGoogle: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileRef = doc(db, "brokers", currentUser.uid);
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            setProfile(snap.data() as BrokerProfile);
          } else {
            // Mismo auto-provisioning que components/AuthProvider.tsx en el
            // Hub web — un login de Google de alguien que nunca entró antes
            // (ni por correo/contraseña en la web) no tendría perfil todavía.
            const newProfile: BrokerProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Broker E360",
              role: "broker",
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error("Error cargando perfil de Firestore:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    let response = await GoogleOneTapSignIn.signIn();
    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.createAccount();
    }
    if (!isSuccessResponse(response)) {
      throw new Error("No se pudo iniciar sesión con Google.");
    }
    const credential = GoogleAuthProvider.credential(response.data.idToken);
    await signInWithCredential(auth, credential);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
