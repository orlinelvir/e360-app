import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: FirebaseOptions(
            apiKey: "AIzaSyCDXt_Pq93ruaYw-YqN1NM73Hl3smf1UYo",
            authDomain: "e360-app.firebaseapp.com",
            projectId: "e360-app",
            storageBucket: "e360-app.firebasestorage.app",
            messagingSenderId: "355923708106",
            appId: "1:355923708106:web:5cef542624924633c84c33",
            measurementId: "G-SF8X7ZBEYB"));
  } else {
    await Firebase.initializeApp();
  }
}
