
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { Star, Crown, LogOut, ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionModal } from "./subscription-modal";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { getAppSettings, type AppSettings } from "@/ai/flows/get-app-settings";
import { updateAppSettings } from "@/ai/flows/update-app-settings";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.357-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.536,44,30.169,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export function SettingsPage() {
    const { t, setLanguage, language } = useTranslation();
    const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");
    const { toast } = useToast();
    const { user, signOut, signInWithGoogle, isFirebaseConfigured } = useAuth();
    const { subscription, cancelSubscription } = useSubscription();
    const [isSubscriptionModalOpen, setSubscriptionModalOpen] = React.useState(false);
    
    // Admin Mode State
    const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
    const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false);
    const [adminCode, setAdminCode] = React.useState('');
    const [isControlsUnlocked, setIsControlsUnlocked] = React.useState(false);

    React.useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as "light" | "dark" | "system" || 'system';
        setTheme(storedTheme);
    }, []);

    // Fetch app settings from server if user has trial
    React.useEffect(() => {
        if (subscription.status === 'trial') {
            getAppSettings()
                .then(settings => {
                    setAppSettings(settings);
                })
                .catch(error => {
                    console.error("Failed to fetch app settings:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not load admin settings from the server.',
                    });
                })
                .finally(() => setIsLoadingSettings(false));
        } else {
            setIsLoadingSettings(false);
        }
    }, [subscription.status, toast]);


    React.useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const handleLanguageChange = (lang: string) => {
        setLanguage(lang as 'en' | 'hi' | 'es' | 'fr');
        toast({
            title: t('toastLanguageTitle'),
            description: t('toastLanguageDescription'),
        });
    }
    
    const handleUnlockControls = () => {
        const ADMIN_SECRET_CODE = "admin649290docgentor@";
        if (adminCode === ADMIN_SECRET_CODE) {
            setIsControlsUnlocked(true);
            toast({
                title: "Admin Controls Unlocked",
                description: "You can now modify app settings.",
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Invalid Code",
                description: "The admin code you entered is incorrect.",
            });
        }
    };

    const handleAdminSettingsUpdate = async () => {
        if (!appSettings || !user) return;
        
        setIsUpdatingSettings(true);
        try {
            await updateAppSettings({ ...appSettings, adminId: user.uid });
            
            // Refetch settings to get the new expiry date
            const updatedSettings = await getAppSettings();
            setAppSettings(updatedSettings);

            toast({
                title: "Settings Updated",
                description: "App settings have been successfully updated on the server.",
            });
        } catch(error: any) {
            console.error("Failed to update app settings:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update settings on the server.',
            });
        } finally {
            setIsUpdatingSettings(false);
        }
    }
    
    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setAppSettings(prev => prev ? { ...prev, [key]: value } : null);
    }

    const isFreemiumCodeExpired = appSettings?.freemiumCodeExpiry ? new Date().getTime() > appSettings.freemiumCodeExpiry : false;

    const renderSubscriptionInfo = () => {
        let subInfo: {
            title: string;
            description: string;
            buttonText: string;
            alertTitle: string;
            alertDescription: string;
            bgColor: string;
            borderColor: string;
            titleColor: string;
            descColor: string;
        } | null = null;
    
        switch (subscription.status) {
            case 'trial':
                subInfo = {
                    title: "Developer Trial Active",
                    description: `Your trial expires on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "End Trial",
                    alertTitle: "End Developer Trial?",
                    alertDescription: "This will immediately revoke all premium access. This action cannot be undone.",
                    bgColor: "bg-purple-50 dark:bg-purple-900/20",
                    borderColor: "border-purple-200 dark:border-purple-800",
                    titleColor: "text-purple-800 dark:text-purple-300",
                    descColor: "text-purple-600 dark:text-purple-400",
                };
                break;
            case 'freemium':
                subInfo = {
                    title: "Freemium Plan Active",
                    description: "You have access to all freemium tools.",
                    buttonText: "Cancel Plan",
                    alertTitle: "Cancel Freemium Plan?",
                    alertDescription: "You will lose access to freemium tools and will need a code to activate it again.",
                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    borderColor: "border-blue-200 dark:border-blue-800",
                    titleColor: "text-blue-800 dark:text-blue-300",
                    descColor: "text-blue-600 dark:text-blue-400",
                };
                break;
            case 'active':
                 subInfo = {
                    title: "Premium Plan Active",
                    description: `Your ${subscription.plan} subscription renews on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "Cancel Plan",
                    alertTitle: "Are you sure?",
                    alertDescription: "This action will cancel your subscription at the end of the current billing period. You will lose access to all premium features after that.",
                    bgColor: "bg-green-50 dark:bg-green-900/20",
                    borderColor: "border-green-200 dark:border-green-800",
                    titleColor: "text-green-800 dark:text-green-300",
                    descColor: "text-green-600 dark:text-green-400",
                };
                break;
            case 'cancelled':
                 subInfo = {
                    title: "Premium Plan (Cancelled)",
                    description: `Your access will expire on ${subscription.expiryDate ? format(new Date(subscription.expiryDate), 'PPP') : 'N/A'}.`,
                    buttonText: "Cancelled",
                    alertTitle: "",
                    alertDescription: "",
                    bgColor: "bg-orange-50 dark:bg-orange-900/20",
                    borderColor: "border-orange-200 dark:border-orange-800",
                    titleColor: "text-orange-800 dark:text-orange-300",
                    descColor: "text-orange-600 dark:text-orange-400",
                };
                break;
            default: // 'inactive'
                return null;
        }
        
        return (
            <div className={cn("flex items-center justify-between space-x-2 p-4 rounded-lg border", subInfo.bgColor, subInfo.borderColor)}>
                <div>
                    <h4 className={cn("font-semibold", subInfo.titleColor)}>{subInfo.title}</h4>
                    <p className={cn("text-sm", subInfo.descColor)}>
                        {subInfo.description}
                    </p>
                </div>
                {subscription.status !== 'cancelled' ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">{subInfo.buttonText}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{subInfo.alertTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {subInfo.alertDescription}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={cancelSubscription} className={buttonVariants({ variant: "destructive" })}>
                                Confirm Cancellation
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <Button disabled>{subInfo.buttonText}</Button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('settingsTitle')}</h1>
                <p className="text-muted-foreground">{t('settingsDescription')}</p>
            </div>

            {subscription.status === 'trial' && (
                <Card className="border-primary bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck /> Admin Mode</CardTitle>
                        <CardDescription>Customize universal app settings in real-time. Changes will affect all users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoadingSettings ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : appSettings ? (
                            <>
                                {!isControlsUnlocked ? (
                                    <div className="space-y-4 rounded-lg border-2 border-dashed bg-background/50 p-6 text-center">
                                        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <h3 className="font-semibold">Controls Locked</h3>
                                        <p className="text-sm text-muted-foreground">Enter the admin secret code to unlock settings.</p>
                                        <div className="flex max-w-sm mx-auto gap-2">
                                            <Input 
                                                type="password"
                                                placeholder="Enter admin code..."
                                                value={adminCode}
                                                onChange={(e) => setAdminCode(e.target.value)}
                                            />
                                            <Button onClick={handleUnlockControls}>Unlock</Button>
                                        </div>
                                    </div>
                                ) : (
                                     <fieldset disabled={isUpdatingSettings}>
                                         <div>
                                            <Label htmlFor="freemium-code">Freemium Activation Code</Label>
                                            {isFreemiumCodeExpired ? (
                                                <Alert variant="destructive">
                                                    <AlertTriangle className="h-4 w-4"/>
                                                    <AlertTitle>Code Expired!</AlertTitle>
                                                    <AlertDescription>
                                                        The previous code has expired. Please set a new 6-digit code to reactivate the freemium plan for users.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : appSettings.freemiumCodeExpiry ? (
                                                <Alert>
                                                    <CheckCircle2 className="h-4 w-4"/>
                                                    <AlertTitle>Code is Active</AlertTitle>
                                                    <AlertDescription>
                                                        Current code is valid until {format(new Date(appSettings.freemiumCodeExpiry), 'PPP p')}.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : null}
                                            <Input
                                                id="freemium-code"
                                                placeholder="Enter a new 6-digit code"
                                                value={appSettings.freemiumCode}
                                                onChange={(e) => handleSettingChange('freemiumCode', e.target.value)}
                                                maxLength={6}
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Setting a new code will automatically assign a 7-day validity period.</p>
                                         </div>
                                         <div>
                                            <Label>Monthly Price (₹{appSettings.monthlyPrice})</Label>
                                            <Slider
                                                value={[appSettings.monthlyPrice]}
                                                onValueChange={(value) => handleSettingChange('monthlyPrice', value[0])}
                                                min={10}
                                                max={100}
                                                step={1}
                                            />
                                         </div>
                                         <div>
                                            <Label>Yearly Price (₹{appSettings.yearlyPrice})</Label>
                                            <Slider
                                                value={[appSettings.yearlyPrice]}
                                                onValueChange={(value) => handleSettingChange('yearlyPrice', value[0])}
                                                min={99}
                                                max={500}
                                                step={1}
                                            />
                                         </div>
                                         <Button className="w-full" onClick={handleAdminSettingsUpdate} disabled={isUpdatingSettings}>
                                             {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                             Save & Update Server Settings
                                         </Button>
                                     </fieldset>
                                )}
                            </>
                        ) : (
                           <p className="text-destructive">Could not load app settings.</p> 
                        )}
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                    <CardDescription>View your current plan and manage your subscription.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderSubscriptionInfo() || (
                         <div className="flex items-center justify-between space-x-2">
                             <Label htmlFor="subscription-status" className="flex flex-col space-y-1">
                                <span>You are on the Free Plan</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Upgrade to unlock premium features or activate the freemium plan.
                                </span>
                            </Label>
                            <Button onClick={() => setSubscriptionModalOpen(true)}>
                                <Crown className="mr-2 h-4 w-4" />
                                Upgrade Now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('appearanceTitle')}</CardTitle>
                    <CardDescription>{t('appearanceDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                            <span>{t('themeTitle')}</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                {t('themeDescription')}
                            </span>
                        </Label>
                        <Switch
                            id="theme-mode"
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            aria-label="Toggle dark mode"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('accountTitle')}</CardTitle>
                    <CardDescription>{t('accountDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="google-auth" className="flex flex-col space-y-1">
                            <span>Account Status</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                {user ? `${t('signedInAs', { email: user.email || '' })}` : "You are not signed in."}
                            </span>
                        </Label>
                        {user ? (
                            <Button variant="outline" onClick={signOut}> <LogOut className="mr-2 h-4 w-4" /> {t('signOut')}</Button>
                        ) : (
                           <Button variant="outline" id="google-auth" onClick={signInWithGoogle} disabled={!isFirebaseConfigured}>
                                <GoogleIcon className="mr-2"/>
                                {t('signInWithGoogle')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('languageRegionTitle')}</CardTitle>
                    <CardDescription>{t('languageRegionDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between space-x-2">
                         <Label htmlFor="language" className="flex-1">
                            {t('appLanguage')}
                        </Label>
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-[200px]" id="language">
                                <SelectValue placeholder={t('selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English (United States)</SelectItem>
                                <SelectItem value="hi">हिन्दी (भारत)</SelectItem>
                                <SelectItem value="es">Español (España)</SelectItem>
                                <SelectItem value="fr">Français (France)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('aboutTitle')}</CardTitle>
                    <CardDescription>{t('aboutDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="help-center">
                            {t('helpCenterTitle')}
                        </Label>
                        <Button variant="outline" id="help-center" asChild>
                            <a href="https://wa.me/916207885443" target="_blank" rel="noopener noreferrer">{t('helpCenterButton')}</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <SubscriptionModal isOpen={isSubscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} />
        </div>
    );
}
