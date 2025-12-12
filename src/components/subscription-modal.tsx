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
import { ArrowRight, CheckCircle, Code, Crown, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { प्लांस as defaultPlans, RAZORPAY_KEY_ID } from "@/config/subscriptions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import Link from 'next/link';
import { getAppSettings } from "@/ai/flows/get-app-settings";

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
      <DialogContent className="max-w-4xl p-0">
        <Tabs defaultValue="premium" className="w-full">
            <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-center text-3xl font-bold flex items-center justify-center gap-2">
                    <Crown className="text-yellow-400" /> Unlock Premium
                </DialogTitle>
                <DialogDescription className="text-center text-md text-muted-foreground">
                    Choose a plan or enter a special code to access more features.
                </DialogDescription>
                 <TabsList className="grid w-full grid-cols-3 mx-auto max-w-md mt-4">
                    <TabsTrigger value="premium">Premium Plans</TabsTrigger>
                    <TabsTrigger value="freemium">Freemium Code</TabsTrigger>
                    <TabsTrigger value="developer">Developer</TabsTrigger>
                </TabsList>
            </DialogHeader>
            <TabsContent value="premium" className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card 
                        className={cn("cursor-pointer border-2 flex flex-col", selectedPlan === 'monthly' ? "border-primary shadow-lg" : "border-border")}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Monthly</CardTitle>
                            <CardDescription>Perfect for short-term projects.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            {pricesLoading ? (
                                <div className="h-[52px] flex items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : (
                                <div className="text-4xl font-bold">
                                    ₹{monthlyPrice} <span className="text-lg text-muted-foreground line-through">₹{defaultPlans.monthly.price}</span>
                                    <span className="text-sm text-muted-foreground"> / month</span>
                                </div>
                            )}
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {defaultPlans.monthly.features.map(feat => (
                                    <li key={feat} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant={selectedPlan === 'monthly' ? 'default' : 'outline'} onClick={() => handlePayment('monthly')} disabled={isLoading !== null || pricesLoading}>
                                {isLoading === 'monthly' ? <Loader2 className="animate-spin" /> : "Choose Monthly"}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card 
                        className={cn("cursor-pointer border-2 flex flex-col relative", selectedPlan === 'yearly' ? "border-primary shadow-lg" : "border-border")}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-full">
                            BEST VALUE
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Yearly</CardTitle>
                            <CardDescription>Get the best value and save big.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                             {pricesLoading ? (
                                <div className="h-[52px] flex items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : (
                                <div className="text-4xl font-bold">
                                    ₹{yearlyPrice} <span className="text-lg text-muted-foreground line-through">₹{defaultPlans.yearly.price}</span>
                                    <span className="text-sm text-muted-foreground"> / year</span>
                                </div>
                            )}
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {defaultPlans.yearly.features.map(feat => (
                                    <li key={feat} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant={selectedPlan === 'yearly' ? 'default' : 'outline'} onClick={() => handlePayment('yearly')} disabled={isLoading !== null || pricesLoading}>
                                {isLoading === 'yearly' ? <Loader2 className="animate-spin" /> : "Choose Yearly"}
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
      </DialogContent>
    </Dialog>
  );
}
