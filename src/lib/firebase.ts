import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling enabled for better compatibility in proxied environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// CRITICAL: Connection health check
async function testConnection() {
  try {
    // Attempting a direct server fetch to confirm the backend is reachable
    // Using a path that has public read access for early initialization
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: Client appears offline.");
    } else {
      // We don't want to spam the UI console with permission errors if it's transient
      console.debug("Firestore connection test status:", error);
    }
  }
}

testConnection();
