
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
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCircle, FileText, Download, Maximize2, Image, FileType, Palette, Sun, Moon, Monitor, Crown, LogOut, Loader2, Mail, Calendar, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionModal } from "./subscription-modal";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { ThemeGallery } from "./theme-gallery";


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
    const [theme, setTheme] = React.useState<"light" | "dark" | "system">("dark");
    const { toast } = useToast();
    const { user, signOut, signInWithGoogle, isFirebaseConfigured } = useAuth();
    const { subscription, cancelSubscription } = useSubscription();
    const [isSubscriptionModalOpen, setSubscriptionModalOpen] = React.useState(false);
    
    // Document Generation Settings
    const [pdfCompression, setPdfCompression] = React.useState<string>('medium');
    const [maxDownloadSize, setMaxDownloadSize] = React.useState<number>(10);
    const [autoOptimize, setAutoOptimize] = React.useState<boolean>(false);
    const [defaultPageSize, setDefaultPageSize] = React.useState<string>('A4');
    const [defaultOrientation, setDefaultOrientation] = React.useState<string>('portrait');
    const [embedFonts, setEmbedFonts] = React.useState<boolean>(true);
    const [colorMode, setColorMode] = React.useState<string>('RGB');
    
    // Admin Mode State
    const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
    const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false);
    const [adminCode, setAdminCode] = React.useState('');
    const [isControlsUnlocked, setIsControlsUnlocked] = React.useState(false);
    
    // Load settings from localStorage on mount
    React.useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as "light" | "dark" | "system" || 'dark';
        setTheme(storedTheme);
        
        // Load document settings
        setPdfCompression(localStorage.getItem('pdfCompression') || 'medium');
        setMaxDownloadSize(parseInt(localStorage.getItem('maxDownloadSize') || '10'));
        setAutoOptimize(localStorage.getItem('autoOptimize') === 'true');
        setDefaultPageSize(localStorage.getItem('defaultPageSize') || 'A4');
        setDefaultOrientation(localStorage.getItem('defaultOrientation') || 'portrait');
        setEmbedFonts(localStorage.getItem('embedFonts') !== 'false');
        setColorMode(localStorage.getItem('colorMode') || 'RGB');
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
    
    const handleDocSettingChange = (key: string, value: any) => {
        localStorage.setItem(key, value.toString());
        switch(key) {
            case 'pdfCompression': setPdfCompression(value); break;
            case 'maxDownloadSize': setMaxDownloadSize(value); break;
            case 'autoOptimize': setAutoOptimize(value); break;
            case 'defaultPageSize': setDefaultPageSize(value); break;
            case 'defaultOrientation': setDefaultOrientation(value); break;
            case 'embedFonts': setEmbedFonts(value); break;
            case 'colorMode': setColorMode(value); break;
        }
        toast({
            title: "Setting Saved",
            description: "Your document generation preference has been updated.",
        });
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

            <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-xl">
                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="h-16 w-16 rounded-full border-2 border-primary/20 p-1" />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                                        <UserCircle className="h-10 w-10 text-primary" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 shadow-lg">
                                    <div className={cn(
                                        "h-3 w-3 rounded-full",
                                        user ? "bg-green-500" : "bg-gray-500"
                                    )} />
                                </div>
                            </div>
                            <div>
                                <CardTitle className="text-xl">{user?.displayName || 'Guest User'}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3" />
                                    {user?.email || 'Not signed in'}
                                </CardDescription>
                            </div>
                        </div>
                        {user && (
                            <Button variant="outline" size="sm" onClick={signOut} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-amber-400" />
                                    Current Plan
                                </span>
                                <Badge variant="secondary" className={cn(
                                    "capitalize",
                                    subscription.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                    subscription.status === 'trial' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                    subscription.status === 'freemium' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                    "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                )}>
                                    {subscription.status === 'inactive' ? 'Free' : subscription.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold capitalize">{subscription.plan === 'none' ? 'Free Tier' : subscription.plan}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {subscription.expiryDate ? `Expires ${format(new Date(subscription.expiryDate), 'MMM dd, yyyy')}` : 'No expiration'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    Usage Stats
                                </span>
                                <span className="text-xs font-bold text-primary">
                                    {subscription.status === 'active' || subscription.status === 'trial' ? 'Unlimited' : `${subscription.imageGenerationCount}/5`}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Generations</span>
                                    <span>{Math.min(100, (subscription.imageGenerationCount / 5) * 100)}%</span>
                                </div>
                                <Progress value={subscription.status === 'active' || subscription.status === 'trial' ? 0 : (subscription.imageGenerationCount / 5) * 100} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground">
                                    {subscription.status === 'active' || subscription.status === 'trial' 
                                        ? 'Premium users have no daily limits.' 
                                        : `${5 - subscription.imageGenerationCount} generations remaining today.`}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-green-400" />
                                    Account Status
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>Verified Account</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full text-xs h-8"
                                    asChild
                                >
                                    <Link href="/upgrade">
                                        {subscription.status === 'inactive' ? 'Upgrade to Premium' : 'Manage Subscription'}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        <div className="flex items-center gap-2">
                            <Button 
                                variant={theme === 'light' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={theme === 'dark' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={theme === 'system' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setTheme('system')}
                            >
                                <Monitor className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Theme Gallery</CardTitle>
                    <CardDescription>Choose from our collection of professionally designed themes</CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeGallery />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />{t('accountTitle')}</CardTitle>
                    <CardDescription>{t('accountDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    
                    {user && (
                        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                            <div className="text-sm font-medium">Account Details</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Plan</div>
                                    <div className="font-medium capitalize">{subscription.status === 'active' ? `Premium ${subscription.plan}` : subscription.status}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Member Since</div>
                                    <div className="font-medium">{user.metadata?.creationTime ? format(new Date(user.metadata.creationTime), 'MMM yyyy') : 'N/A'}</div>
                                </div>
                                {subscription.status === 'active' && subscription.expiryDate && (
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground">Valid Until</div>
                                        <div className="font-medium">{format(new Date(subscription.expiryDate), 'PPP')}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Generation Settings</CardTitle>
                    <CardDescription>Customize how your documents are generated and optimized</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-compression" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            PDF Compression Level
                        </Label>
                        <Select value={pdfCompression} onValueChange={(v) => handleDocSettingChange('pdfCompression', v)}>
                            <SelectTrigger id="pdf-compression">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Highest Quality)</SelectItem>
                                <SelectItem value="low">Low (Large Size)</SelectItem>
                                <SelectItem value="medium">Medium (Balanced) ⭐</SelectItem>
                                <SelectItem value="high">High (Smaller Size)</SelectItem>
                                <SelectItem value="maximum">Maximum (Smallest Size)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Higher compression = smaller file size but slightly lower quality</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max-size" className="flex items-center gap-2">
                            <Maximize2 className="h-4 w-4" />
                            Max Download Size: {maxDownloadSize} MB
                        </Label>
                        <Slider
                            id="max-size"
                            value={[maxDownloadSize]}
                            onValueChange={(v) => handleDocSettingChange('maxDownloadSize', v[0])}
                            min={1}
                            max={50}
                            step={1}
                        />
                        <p className="text-xs text-muted-foreground">Limit maximum file size for downloads (1-50 MB)</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-optimize" className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                Auto-Optimize Images
                            </Label>
                            <p className="text-xs text-muted-foreground">Automatically compress images in PDFs</p>
                        </div>
                        <Switch
                            id="auto-optimize"
                            checked={autoOptimize}
                            onCheckedChange={(v) => handleDocSettingChange('autoOptimize', v)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="page-size">Default Page Size</Label>
                            <Select value={defaultPageSize} onValueChange={(v) => handleDocSettingChange('defaultPageSize', v)}>
                                <SelectTrigger id="page-size">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                                    <SelectItem value="A3">A3 (297×420mm)</SelectItem>
                                    <SelectItem value="Letter">Letter (8.5×11")</SelectItem>
                                    <SelectItem value="Legal">Legal (8.5×14")</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="orientation">Orientation</Label>
                            <Select value={defaultOrientation} onValueChange={(v) => handleDocSettingChange('defaultOrientation', v)}>
                                <SelectTrigger id="orientation">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                    <SelectItem value="landscape">Landscape</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="embed-fonts" className="flex items-center gap-2">
                                <FileType className="h-4 w-4" />
                                Embed Fonts in PDF
                            </Label>
                            <p className="text-xs text-muted-foreground">Ensures consistent appearance across devices</p>
                        </div>
                        <Switch
                            id="embed-fonts"
                            checked={embedFonts}
                            onCheckedChange={(v) => handleDocSettingChange('embedFonts', v)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color-mode" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Color Mode
                        </Label>
                        <Select value={colorMode} onValueChange={(v) => handleDocSettingChange('colorMode', v)}>
                            <SelectTrigger id="color-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RGB">RGB (Screen Display)</SelectItem>
                                <SelectItem value="CMYK">CMYK (Professional Print)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Use CMYK for professional printing, RGB for digital</p>
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
