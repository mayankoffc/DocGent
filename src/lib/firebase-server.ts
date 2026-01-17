import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let db: Firestore;
let projectId: string | undefined;

try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
        
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
    } else {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
    }
} catch(error) {
    console.warn("Could not initialize Firebase Admin SDK. Server-side Firebase features will be limited. Please set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
    // @ts-ignore - Assign null to satisfy TypeScript when not configured.
    adminApp = null;
    // @ts-ignore
    adminAuth = null;
    // @ts-ignore
    db = null;
    projectId = undefined;
}


export { adminAuth, db, projectId };
