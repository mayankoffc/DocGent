"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle, Code, Crown, Loader2, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { प्लांस as defaultPlans, RAZORPAY_KEY_ID } from "@/config/subscriptions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { getAppSettings } from "@/ai/flows/get-app-settings";
import { useTranslation } from "@/hooks/use-translation";

interface SubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function SubscriptionModal({ isOpen, onOpenChange }: SubscriptionModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { subscription, subscribe } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState<null | 'monthly' | 'yearly' | 'freemium'>(null);
  const [devCode, setDevCode] = useState('');
  const [freemiumCode, setFreemiumCode] = useState('');
  const [liveSettings, setLiveSettings] = useState<any>(null); // Using `any` for now
  const [pricesLoading, setPricesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        setPricesLoading(true);
        getAppSettings()
          .then((settings) => {
            setLiveSettings(settings);
          })
          .catch(error => {
            console.error("Failed to fetch app settings:", error);
            // Fallback to default prices if the API call fails
            setLiveSettings({
              monthlyPrice: defaultPlans.monthly.discountedPrice,
              yearlyPrice: defaultPlans.yearly.discountedPrice,
            });
          })
          .finally(() => {
            setPricesLoading(false);
          });
    }
  }, [isOpen]);

  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to subscribe.",
        variant: "destructive",
      });
      // Optionally, you could redirect to login here
      return;
    }

    if (!RAZORPAY_KEY_ID) {
        toast({
            title: "Payment Error",
            description: "Payment gateway is not configured. Please contact support.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(plan);

    try {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan }),
        });

        const order = await response.json();
        
        if (!response.ok) {
          throw new Error(order.error || 'Failed to create order.');
        }

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "DOC AI Premium",
            description: `DOC AI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            order_id: order.id,
            handler: async function (response: any) {
              setIsLoading(null);
              const verificationResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              
              const verificationData = await verificationResponse.json();

              if (verificationData.isVerified) {
                subscribe(plan, false);
                toast({
                    title: "Payment Successful!",
                    description: "Welcome to Premium! All features are now unlocked.",
                });
                onOpenChange(false);
              } else {
                toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: "Your payment could not be verified. Please contact support.",
                });
              }
            },
            prefill: {
                name: user.displayName || '',
                email: user.email || '',
            },
            theme: {
                color: "#8B5CF6"
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
                toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: response.error.description
                });
                setIsLoading(null);
        });
        rzp1.open();

    } catch (error) {
        console.error("Payment initiation failed", error);
        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: "Could not initiate the payment process. Please try again.",
        });
        setIsLoading(null);
    }
  };
  
  const handleActivateFreemium = async () => {
    if (!user) {
        toast({ title: "Login Required", description: "Please sign in to activate a plan.", variant: "destructive" });
        return;
    }
    setIsLoading('freemium');
    try {
        const settings = await getAppSettings();
        if (freemiumCode === settings.freemiumCode) {
            const now = new Date().getTime();
            if (settings.freemiumCodeExpiry && now > settings.freemiumCodeExpiry) {
                 toast({
                    title: 'Code Expired',
                    description: 'This freemium code has expired.',
                    variant: 'destructive',
                });
                setIsLoading(null);
                return;
            }
            subscribe('freemium', false);
            onOpenChange(false);
        } else {
             toast({
                title: 'Invalid Code',
                description: 'The Freemium activation code is incorrect.',
                variant: 'destructive',
            });
        }
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'Could not verify the code. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(null);
    }
  };

  const handleActivateDeveloperTrial = () => {
     if (!user) {
        toast({ title: "Login Required", description: "Please sign in to activate a plan.", variant: "destructive" });
        return;
    }
    if (devCode === 'dev2784docgentorai') {
        subscribe('yearly', true); // Grant a yearly plan as a trial
        onOpenChange(false);
    } else {
        toast({
            title: 'Invalid Code',
            description: 'The developer trial code is incorrect.',
            variant: 'destructive',
        });
    }
  };

  const monthlyPrice = liveSettings ? liveSettings.monthlyPrice : defaultPlans.monthly.discountedPrice;
  const yearlyPrice = liveSettings ? liveSettings.yearlyPrice : defaultPlans.yearly.discountedPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl p-0 bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
        wrapperClassName="animate-float-modal"
      >
        <div className="w-full h-full">
          <Tabs defaultValue="premium" className="w-full">
            <DialogHeader className="p-8 pb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                <DialogTitle className="text-center text-4xl font-black flex items-center justify-center gap-3 tracking-tighter">
                    <Crown className="text-amber-400 w-10 h-10" /> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 uppercase">{t('upgradeToUltra')}</span>
                </DialogTitle>
                <DialogDescription className="text-center text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                    {t('upgradeDescription')}
                </DialogDescription>
                <div className="flex justify-center mt-6">
                    <Link href="/upgrade" onClick={() => onOpenChange(false)}>
                        <Button variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 gap-2 px-6">
                            <Sparkles className="w-4 h-4" />
                            {t('compareFeatures')} →
                        </Button>
                    </Link>
                </div>
                 <TabsList className="grid w-full grid-cols-3 mx-auto max-w-md mt-8 bg-white/5 p-1 rounded-xl border border-white/10">
                    <TabsTrigger value="premium" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">{t('plans')}</TabsTrigger>
                    <TabsTrigger value="freemium" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">{t('redeem')}</TabsTrigger>
                    <TabsTrigger value="developer" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">{t('devAccess')}</TabsTrigger>
                </TabsList>
            </DialogHeader>
            
            <TabsContent value="premium" className="px-8 pb-8 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Monthly Plan */}
                    <Card 
                        className={cn(
                            "cursor-pointer border-2 flex flex-col transition-all duration-500 group relative overflow-hidden", 
                            selectedPlan === 'monthly' ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                        )}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-bold text-blue-400">{t('premiumPro')}</CardTitle>
                                <Badge variant="outline" className="border-blue-500/30 text-blue-400">{t('monthly')}</Badge>
                            </div>
                            <CardDescription className="text-white/60">{t('premiumProDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6">
                            {pricesLoading ? (
                                <div className="h-[60px] flex items-center"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black">₹{monthlyPrice}</span>
                                    <span className="text-muted-foreground line-through text-xl">₹{defaultPlans.monthly.price}</span>
                                    <span className="text-sm text-muted-foreground">/{t('mo')}</span>
                                </div>
                            )}
                            <ul className="space-y-3">
                                {[
                                    t('featUnlimitedExec'),
                                    t('featAllTools'),
                                    t('featNoWatermarks'),
                                    t('featPrioritySupport')
                                ].map(feat => (
                                    <li key={feat} className="flex items-center gap-3 text-sm text-white/80">
                                        <div className="p-1 rounded-full bg-blue-500/20">
                                            <CheckCircle className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className={cn(
                                    "w-full h-12 text-lg font-bold transition-all",
                                    selectedPlan === 'monthly' ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg" : "bg-white/5 hover:bg-white/10 text-white"
                                )}
                                onClick={() => handlePayment('monthly')} 
                                disabled={isLoading !== null || pricesLoading}
                            >
                                {isLoading === 'monthly' ? <Loader2 className="animate-spin" /> : `${t('activate')} Pro`}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Yearly Plan */}
                    <Card 
                        className={cn(
                            "cursor-pointer border-2 flex flex-col relative transition-all duration-500 group overflow-hidden", 
                            selectedPlan === 'yearly' ? "border-primary shadow-[0_0_50px_hsl(var(--primary)/0.2)] bg-primary/5" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                        )}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest z-10">
                            BEST VALUE
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                    <Crown className="w-6 h-6 text-amber-400" />
                                    {t('premiumUltra')}
                                </CardTitle>
                                <Badge className="bg-primary/20 text-primary border-primary/30">{t('yearly')}</Badge>
                            </div>
                            <CardDescription className="text-white/60">{t('premiumUltraDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6">
                             {pricesLoading ? (
                                <div className="h-[60px] flex items-center"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black">₹{yearlyPrice}</span>
                                    <span className="text-muted-foreground line-through text-xl">₹{defaultPlans.yearly.price}</span>
                                    <span className="text-sm text-muted-foreground">/{t('yr')}</span>
                                </div>
                            )}
                            <ul className="space-y-3">
                                {[
                                    t('featEverythingPro'),
                                    t('featAdvancedModel'),
                                    t('feat8kUpscale'),
                                    t('featEarlyAccess'),
                                    t('featSave40')
                                ].map(feat => (
                                    <li key={feat} className="flex items-center gap-3 text-sm text-white/90">
                                        <div className="p-1 rounded-full bg-primary/20">
                                            <CheckCircle className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className={feat.includes('Save') || feat.includes('बचाएं') ? "text-primary font-bold" : ""}>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className={cn(
                                    "w-full h-12 text-lg font-black transition-all",
                                    selectedPlan === 'yearly' ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_hsl(var(--primary)/0.4)]" : "bg-white/5 hover:bg-white/10 text-white"
                                )}
                                onClick={() => handlePayment('yearly')} 
                                disabled={isLoading !== null || pricesLoading}
                            >
                                {isLoading === 'yearly' ? <Loader2 className="animate-spin" /> : "DEPLOY ULTRA"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="freemium" className="px-6 pb-6">
                <Card className="bg-muted/50 border-dashed">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="text-blue-500"/> Freemium Access</CardTitle>
                        <CardDescription>Got a special code? Enter it here to unlock freemium features.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        {subscription.status === 'freemium' || subscription.status === 'active' || subscription.status === 'trial' ? (
                            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle className="text-green-800 dark:text-green-300">Freemium Plan is Active</AlertTitle>
                                <AlertDescription className="text-green-600 dark:text-green-400">
                                    You already have access to all freemium features.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1 w-full">
                                    <label htmlFor="freemium-code" className="sr-only">Freemium Code</label>
                                    <Input 
                                        id="freemium-code"
                                        placeholder="Enter your freemium code"
                                        value={freemiumCode}
                                        onChange={(e) => setFreemiumCode(e.target.value)}
                                        type="text"
                                    />
                                </div>
                                <Button className="w-full sm:w-auto" variant="secondary" onClick={handleActivateFreemium} disabled={isLoading !== null}>
                                    {isLoading === 'freemium' ? <Loader2 className="animate-spin" /> : "Activate"}
                                </Button>
                            </div>
                        )}
                     </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="developer" className="px-6 pb-6 space-y-4">
                <Card className="bg-muted/50 border-dashed">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Code className="text-gray-500"/> Developer Access</CardTitle>
                        <CardDescription>Join our developer program or enter your trial code.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <Link href="/waitlist" passHref>
                          <Button className="w-full" variant="outline">
                            Join Developer Waitlist
                            <ArrowRight className="ml-2 h-4 w-4"/>
                          </Button>
                        </Link>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                Or
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dev-code">Activate Trial</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Input 
                                    id="dev-code"
                                    placeholder="Enter your developer code"
                                    value={devCode}
                                    onChange={(e) => setDevCode(e.target.value)}
                                />
                                <Button className="w-full sm:w-auto" onClick={handleActivateDeveloperTrial}>Activate</Button>
                            </div>
                        </div>
                     </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
