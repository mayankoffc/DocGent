
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useToast } from './use-toast';
import { Button } from '@/components/ui/button';

// Define the shape of the user profile we expect from Google
interface GoogleUserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
    uid: string; // Add uid for consistency if needed elsewhere
}

interface AuthContextType {
    user: GoogleUserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    isGoogleReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// These are public keys, it's safe to have them in the code.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// The scope defines what permissions we ask from the user.
// 'drive.file' is a secure scope that only allows the app to access files it has created.
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<GoogleUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [gapi, setGapi] = useState<any>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const { toast } = useToast();

    // Fetch user profile from Google
    const fetchUserProfile = useCallback(async (gapiInstance: any) => {
        if (!gapiInstance || !gapiInstance.client.getToken()) return;
        try {
            const response = await gapiInstance.client.request({
                path: 'https://www.googleapis.com/oauth2/v3/userinfo'
            });
            const profile = response.result as any;
            const userData = { id: profile.sub, uid: profile.sub, name: profile.name, email: profile.email, picture: profile.picture };
            setUser(userData);
            localStorage.setItem('google_user_profile', JSON.stringify(userData));
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            setUser(null);
            gapiInstance.client.setToken(null);
            localStorage.removeItem('google_user_profile');
        }
    }, []);

    // Initialize GAPI and GIS clients
    useEffect(() => {
        const scriptGapi = document.createElement('script');
        scriptGapi.src = 'https://apis.google.com/js/api.js';
        scriptGapi.async = true;
        scriptGapi.defer = true;
        scriptGapi.onload = () => {
            const gapi = (window as any).gapi;
            setGapi(gapi);
            gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                
                // Restore session
                const token = gapi.client.getToken();
                if (token) {
                    const storedProfile = localStorage.getItem('google_user_profile');
                    if(storedProfile) setUser(JSON.parse(storedProfile));
                    else await fetchUserProfile(gapi);
                }
                
                setIsGoogleReady(true);
                setLoading(false);
            });
        };
        document.body.appendChild(scriptGapi);

        const scriptGis = document.createElement('script');
        scriptGis.src = 'https://accounts.google.com/gsi/client';
        scriptGis.async = true;
        scriptGis.defer = true;
        scriptGis.onload = () => {
            const gis = (window as any).google?.accounts?.oauth2;
            if (gis) {
                 if (!CLIENT_ID) {
                    console.error("Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.");
                    return;
                }
                const client = gis.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: '', // Callback is handled by the Promise wrapper in signIn
                });
                setTokenClient(client);
            }
        };
        document.body.appendChild(scriptGis);

        return () => {
            document.body.removeChild(scriptGapi);
            document.body.removeChild(scriptGis);
        }
    }, [fetchUserProfile]);

    const signIn = async () => {
        if (!gapi || !tokenClient) {
            toast({ variant: 'destructive', title: 'Error', description: 'Google Auth is not ready. Please wait a moment and try again.' });
            return;
        }

        return new Promise<void>((resolve, reject) => {
            const callback = async (resp: any) => {
                if (resp.error !== undefined) {
                    reject(resp);
                    toast({ variant: 'destructive', title: 'Sign-in Error', description: `Google sign-in failed: ${resp.error_description || resp.error}` });
                    return;
                }
                await fetchUserProfile(gapi);
                toast({ title: 'Success!', description: 'You have signed in successfully.' });
                resolve();
            };
            
            if (gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent', callback });
            } else {
                tokenClient.requestAccessToken({ prompt: '', callback });
            }
        });
    };

    const signOut = async () => {
        if (gapi && gapi.client.getToken() !== null) {
            const token = gapi.client.getToken();
            gapi.client.setToken(null);
            setUser(null);
            localStorage.removeItem('google_user_profile');
            // Revoke the token to actually sign out from Google's perspective
            (window as any).google?.accounts?.oauth2?.revoke(token.access_token, () => {});
            toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
        }
    };
    
    const getAccessToken = async (): Promise<string | null> => {
        if (!gapi || !tokenClient) {
             console.error("GAPI or TokenClient not ready");
             return null;
        }
        
        const token = gapi.client.getToken();
        if (token && new Date().getTime() < new Date(token.expires_at).getTime()) {
            return token.access_token;
        }

        // If token is expired or doesn't exist, we need to get a new one.
        return new Promise<string | null>((resolve, reject) => {
             const callback = (resp: any) => {
                if (resp.error !== undefined) {
                    reject(new Error(resp.error_description || 'Failed to refresh token'));
                    resolve(null);
                    return;
                }
                resolve(gapi.client.getToken().access_token);
            };

            tokenClient.requestAccessToken({ prompt: '', callback });
        });
    };

    const value = { user, loading, signIn, signOut, getAccessToken, isGoogleReady };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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
