
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { getAppSettings } from '@/ai/flows/get-app-settings';
import { getUserData } from '@/ai/flows/user-data';

export type Plan = 'monthly' | 'yearly' | 'freemium' | 'none';
export type SubscriptionStatus = 'active' | 'freemium' | 'trial' | 'inactive' | 'cancelled';

export interface Subscription {
    plan: Plan;
    status: SubscriptionStatus;
    isTrial: boolean;
    expiryDate: number | null;
    imageGenerationCount: number;
}

interface SubscriptionContextType {
    subscription: Subscription;
    subscribe: (plan: Plan, isTrial: boolean) => void;
    cancelSubscription: () => void;
    refreshSubscription: () => Promise<void>;
    loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const defaultSubscription: Subscription = {
    plan: 'none',
    status: 'inactive',
    isTrial: false,
    expiryDate: null,
    imageGenerationCount: 0,
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
    const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const validateSubscription = useCallback(async () => {
        setLoading(true);
        const now = Date.now();
        let activeSub: Subscription = defaultSubscription;

        try {
            const storage = user ? localStorage : sessionStorage;
            const storageKey = user ? `subscription_${user.uid}` : 'guest_subscription';
            const storedSubscription = storage.getItem(storageKey);

            if (storedSubscription) {
                let parsedSub = JSON.parse(storedSubscription) as Subscription;
                
                if (parsedSub.status !== 'inactive' && parsedSub.status !== 'cancelled' && parsedSub.expiryDate && parsedSub.expiryDate <= now) {
                    parsedSub = { ...defaultSubscription };
                }

                if (parsedSub.status === 'freemium') {
                    const appSettings = await getAppSettings();
                    const isCodeExpired = appSettings.freemiumCodeExpiry ? now > appSettings.freemiumCodeExpiry : true;
                    if (isCodeExpired) {
                        parsedSub = { ...defaultSubscription };
                    }
                }
                
                activeSub = { ...parsedSub }; // Create a new object
            }
            
            if (user && activeSub.status !== 'active' && activeSub.status !== 'trial') {
                 const userData = await getUserData(user.uid);
                 activeSub.imageGenerationCount = userData.imageGenerationCount;
            } else if (!user) {
                 activeSub.imageGenerationCount = 0; // Guests can't generate images
            }


            const finalSub = { ...activeSub };
            storage.setItem(storageKey, JSON.stringify(finalSub));
            setSubscription(finalSub);

        } catch (e) {
            console.error("Failed to parse or validate subscription from storage", e);
            setSubscription(defaultSubscription);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        validateSubscription();
    }, [user, validateSubscription]);

    const saveSubscription = (sub: Subscription) => {
        const storage = user ? localStorage : sessionStorage;
        const storageKey = user ? `subscription_${user.uid}` : 'guest_subscription';
        storage.setItem(storageKey, JSON.stringify(sub));
        setSubscription(sub);
    };
    
    const subscribe = useCallback((plan: Plan, isTrial: boolean) => {
        if (plan === 'none') return;
    
        const now = new Date();
        let expiryDate: Date | null = null;
        let title = "Subscription Activated!";
        let description = `You are now on the ${plan} plan.`;
        let status: SubscriptionStatus = 'inactive';

        if (isTrial) {
            expiryDate = new Date();
            expiryDate.setDate(now.getDate() + 7);
            title = "Developer Trial Activated!";
            description = ('You now have premium access for 7 days.');
            status = 'trial';
        } else if (plan === 'monthly') {
            expiryDate = new Date(now.setMonth(now.getMonth() + 1));
            status = 'active';
        } else if (plan === 'yearly') {
            expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
            status = 'active';
        } else if (plan === 'freemium') {
            expiryDate = null;
            title = "Freemium Plan Activated!";
            description = "You now have access to our standard features.";
            status = 'freemium';
        }

        const newSubscription: Subscription = {
            plan,
            status,
            isTrial,
            expiryDate: expiryDate ? expiryDate.getTime() : null,
            imageGenerationCount: 0, // Reset count on new subscription
        };
    
        saveSubscription(newSubscription);
        
        toast({
            description: (
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="flex flex-col">
                        <span className="font-bold">{title}</span>
                        <span className="text-xs">{description}</span>
                    </div>
                </div>
            )
        });

    }, [toast]);

    const cancelSubscription = useCallback(() => {
        if (subscription.status === 'inactive') return;

        let cancelledSub: Subscription = { ...subscription };

        if (subscription.status === 'active') {
            cancelledSub.status = 'cancelled';
            toast({
                title: "Subscription Cancelled",
                description: `Your plan will remain active until ${subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'the end of the period'}.`,
            });
        } else {
            cancelledSub = defaultSubscription;
            toast({
                title: "Plan Deactivated",
                description: `Your ${subscription.plan} access has ended.`,
            });
        }
        
        saveSubscription(cancelledSub);

    }, [subscription, toast]);

    const value = { subscription, subscribe, cancelSubscription, refreshSubscription: validateSubscription, loading };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
