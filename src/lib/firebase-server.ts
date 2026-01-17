import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import serviceAccountJson from './firebase-service-account.json';

let adminApp: App;
let adminAuth: Auth;
let db: Firestore;
let projectId: string | undefined;

try {
    const serviceAccount = serviceAccountJson as ServiceAccount;

    if (serviceAccount && (serviceAccount as any).project_id) {
        projectId = (serviceAccount as any).project_id;
        if (!getApps().length) {
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
            adminApp = getApp();
        }
        adminAuth = getAdminAuth(adminApp);
        db = getFirestore(adminApp);
    } else {
         throw new Error("Firebase Admin SDK service account key is missing or invalid.");
    }
} catch(error) {
    console.warn("Could not initialize Firebase Admin SDK. This can happen if the service account key is missing or malformed in 'src/lib/firebase-service-account.json'. Server-side Firebase features will be limited.");
    // @ts-ignore - Assign null to satisfy TypeScript when not configured.
    adminApp = null;
    // @ts-ignore
    adminAuth = null;
    // @ts-ignore
    db = null;
    projectId = undefined;
}


export { adminAuth, db, projectId };
