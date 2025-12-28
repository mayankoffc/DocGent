
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from './use-toast';
import { Loader2, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useTranslation } from './use-translation';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { sendOtp } from '@/ai/flows/send-otp';
import { resetPassword } from '@/ai/flows/reset-password-flow';
import { createUserDataFlow } from '@/ai/flows/user-data';

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<FirebaseUser>;
    signUp: (name: string, email: string, pass: string) => Promise<void>;
    verifySignUpOtp: (email: string, otp: string) => Promise<FirebaseUser>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<FirebaseUser>;
    getAccessToken: () => Promise<string | null>;
    isFirebaseConfigured: boolean;
    requestPasswordResetOtp: (email: string) => Promise<void>;
    resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory storage for OTPs, valid for 10 minutes. In production, use a more robust solution like Firestore or Redis.
const otpStore: { [key: string]: { otp: string; timestamp: number } } = {};
const TEMP_USER_KEY = 'temp_signup_user';


const handleFirebaseError = (error: any): string => {
  if (typeof error.code === 'string') {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Invalid email or password. Please try again.";
      case 'auth/email-already-in-use':
        return "This email address is already registered. Please sign in or use a different email.";
      case 'auth/weak-password':
        return "The password is too weak. It must be at least 6 characters long.";
      case 'auth/invalid-email':
        return "The email address is not valid.";
      case 'auth/operation-not-allowed':
        return "This sign-in method is not enabled. Please contact support.";
      case 'auth/popup-closed-by-user':
        return "The sign-in popup was closed before completion. Please try again.";
      case 'auth/invalid-action-code':
         return "The password reset link is invalid or has expired. Please try again.";
      default:
        console.error("Firebase Auth Error:", error);
        return "An unexpected error occurred. Please try again later.";
    }
  }
  return "An unexpected error occurred. Please try again later.";
}

const createUserDataInFirestore = async (user: FirebaseUser) => {
    try {
        await createUserDataFlow({
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
        });
    } catch (error) {
        console.error("Failed to create user data in Firestore:", error);
        // This might not need to be a user-facing error, but good to log.
    }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { t } = useTranslation();
    const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; description: string; details?: string[] }>({ open: false, title: '', description: '' });

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If a user is found, create their data if it doesn't exist.
                // Awaiting this ensures that user data is settled before the app proceeds.
                await createUserDataInFirestore(user);
                sessionStorage.removeItem('isGuest'); // Not a guest if logged in
            } else {
                sessionStorage.removeItem(TEMP_USER_KEY); // Clear temp user on sign-out
            }
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const generateAndSendOtp = async (email: string, userName?: string): Promise<void> => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, timestamp: Date.now() }; 
        try {
            await sendOtp({ email, otp, userName });
        } catch (e) {
            console.error("sendOtp failed:", e);
            throw new Error("Could not send verification code to your email. Please try again.");
        }
    };
    
    const verifyClientOtp = (email: string, providedOtp: string): boolean => {
        const stored = otpStore[email];
        if (!stored) return false;
        const isExpired = (Date.now() - stored.timestamp) > 10 * 60 * 1000; // 10 minutes
        if (isExpired) {
            delete otpStore[email];
            return false;
        }
        if (stored.otp === providedOtp) {
            delete otpStore[email];
            return true;
        }
        return false;
    }

    const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Authentication service is not available.");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            return userCredential.user;
        } catch (error) {
             // Fallback to mock user if in dev mode with dummy keys
             if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'dummy') {
                const mockUser = {
                    uid: 'mock-user-123',
                    email: email,
                    displayName: 'Mock User',
                    emailVerified: true,
                    isAnonymous: false,
                    metadata: {},
                    providerData: [],
                    refreshToken: '',
                    tenantId: null,
                    delete: async () => {},
                    getIdToken: async () => 'mock-token',
                    getIdTokenResult: async () => ({ token: 'mock-token', claims: {}, authTime: Date.now(), issuedAtTime: Date.now(), expirationTime: Date.now() + 3600, signInProvider: 'password', signInSecondFactor: null, loading: false }),
                    reload: async () => {},
                    toJSON: () => ({}),
                    phoneNumber: null,
                    photoURL: null,
                    providerId: 'firebase',
                } as unknown as FirebaseUser;
                setUser(mockUser);
                return mockUser;
             }
            throw new Error(handleFirebaseError(error));
        }
    };
    
    const signUp = async (name: string, email: string, pass: string): Promise<void> => {
        if (!auth) throw new Error("Authentication service is not available.");
         try {
            const tempUser = { name, email, pass };
            sessionStorage.setItem(TEMP_USER_KEY, JSON.stringify(tempUser));
            await generateAndSendOtp(email, name);
        } catch (error: any) {
            throw new Error(error.message || handleFirebaseError(error));
        }
    };

    const verifySignUpOtp = async (email: string, otp: string): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Authentication service is not available.");
        if (!verifyClientOtp(email, otp)) {
            throw new Error("Invalid or expired OTP.");
        }
        const tempUserString = sessionStorage.getItem(TEMP_USER_KEY);
        if (!tempUserString) {
            throw new Error("Sign-up session expired. Please start over.");
        }
        const { name, pass } = JSON.parse(tempUserString);
        if (!name || !pass) {
            throw new Error("Incomplete sign-up data.");
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            sessionStorage.removeItem(TEMP_USER_KEY);
            // The onAuthStateChanged listener will handle creating the user data in Firestore
            return userCredential.user;
        } catch (error) {
             throw new Error(handleFirebaseError(error));
        }
    }

    const requestPasswordResetOtp = async (email: string): Promise<void> => {
        if (!auth) throw new Error("Authentication service is not available.");
        try {
            await generateAndSendOtp(email);
        } catch(error: any) {
            throw new Error(error.message || handleFirebaseError(error));
        }
    };

    const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string): Promise<void> => {
        if (!verifyClientOtp(email, otp)) {
            throw new Error("Invalid or expired OTP. Please request a new one.");
        }
        try {
            const result = await resetPassword({ email, otp, newPassword });
            if (!result.success) {
                throw new Error(result.message);
            }
        } catch (error: any) {
            throw new Error(error.message || "Failed to reset password. Please try again.");
        }
    };


    const signInWithGoogle = async (): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Authentication service is not available.");
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        try {
            const result = await signInWithPopup(auth, provider);
            // The onAuthStateChanged listener will handle creating the user data in Firestore
            return result.user;
        } catch (error: any) {
            if (error.code === 'auth/auth-domain-config-required' || error.message.includes('redirect_uri_mismatch')) {
                 const domainName = window.location.hostname;
                 setErrorDialog({
                    open: true,
                    title: t('toastActionRequired'),
                    description: t('toastUserErrorDesc'),
                    details: [
                        t('toastDeveloperTitle'),
                        t('toastActionRequiredDesc1'),
                        t('toastActionRequiredDesc2'),
                        domainName,
                        t('toastActionRequiredDesc3'),
                        t('toastActionRequiredDesc4'),
                        t('toastActionRequiredDesc5'),
                    ]
                });
            } else {
                 toast({ variant: "destructive", title: "Sign In Failed", description: handleFirebaseError(error) });
            }
            throw error;
        }
    };

    const signOut = async () => {
        if (!auth) throw new Error("Authentication service is not available.");
        sessionStorage.removeItem('isGuest');
        await firebaseSignOut(auth);
        toast({ title: t('toastSignOutSuccess'), description: t('toastSignOutSuccessDesc') });
    };

    const getAccessToken = async (): Promise<string | null> => {
        if (!user) return null;
        try {
            return await user.getIdToken(true);
        } catch (error) {
            console.error("Error getting access token:", error);
            return null;
        }
    };
    
    const value = { user, loading, signIn, signUp, verifySignUpOtp, signOut, signInWithGoogle, getAccessToken, isFirebaseConfigured, requestPasswordResetOtp, resetPasswordWithOtp };

    if (!isFirebaseConfigured) {
        return (
           <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
               <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
               <p className="mt-2 text-muted-foreground"> Please add your Firebase configuration variables to the <strong>.env</strong> file to enable authentication and other features. </p>
           </div>
       );
   }

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : (
                children
            )}
            <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({...prev, open}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {errorDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {errorDialog.details && (
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button variant="link" className="text-xs p-0 h-auto">Show Details <ChevronDown className="w-4 h-4 ml-1"/></Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-4 text-xs space-y-2 bg-muted p-4 rounded-md">
                                    <p className="font-bold">{errorDialog.details[0]}</p>
                                    <p>{errorDialog.details[1]}</p>
                                    <p>1. {errorDialog.details[2]}</p>
                                    <div className="flex items-center gap-2">
                                        <pre className="bg-background p-2 rounded-md text-destructive-foreground break-all flex-1">{errorDialog.details[3]}</pre>
                                        <Button size="sm" onClick={() => {
                                            navigator.clipboard.writeText(errorDialog.details![3]);
                                            toast({ title: t('toastCopiedToClipboard') });
                                        }}>Copy</Button>
                                    </div>
                                    <p>2. {errorDialog.details[4]}</p>
                                    <p className="pl-4">{errorDialog.details[5]}</p>
                                    <p className="pl-4">{errorDialog.details[6]}</p>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setErrorDialog(prev => ({...prev, open: false}))}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
