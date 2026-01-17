
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Star, Shield, Sparkles, Rocket, Image, FileText, Brain, Clock, MessageSquare, ArrowRight, ChevronRight, Gem, Award, FileEdit, BookOpenCheck, DraftingCompass, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/header";

const features = [
    {
        title: "Intelligence Engine",
        description: "Access our most sophisticated architectural models for complex document synthesis and deep analysis.",
        icon: Brain,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        title: "Executive Editor",
        description: "Professional drafting suite with advanced refactoring, structural formatting, and multi-vector exports.",
        icon: FileEdit,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "8K Visual Optimizer",
        description: "Enhance low-fidelity imagery into hyper-clear 8K professional assets with neural clarity.",
        icon: Image,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    },
    {
        title: "Academic Architect",
        description: "Deconstruct complex curricula and exam structures with rigorous step-by-step logic.",
        icon: BookOpenCheck,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Blueprint Designer",
        description: "Engineer comprehensive project architectures, technical schematics, and structural blueprints.",
        icon: DraftingCompass,
        color: "text-rose-400",
        bg: "bg-rose-400/10"
    },
    {
        title: "Neural Script OCR",
        description: "Transform analog handwritten manuscripts into high-fidelity, structured digital assets.",
        icon: PenSquare,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
    }
];

const additionalPerks = [
    "Unlimited Daily Executions",
    "High-Fidelity Clean Exports",
    "Tier-1 Priority Support",
    "Zero-Interruption Experience",
    "Beta Access to Lab Tools",
    "Batch Processing Pipeline"
];

const CrossMark = () => (
    <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
        <div className="relative w-2.5 h-2.5">
            <div className="absolute inset-0 w-full h-0.5 bg-rose-500 rotate-45 top-1/2 -translate-y-1/2 rounded-full" />
            <div className="absolute inset-0 w-full h-0.5 bg-rose-500 -rotate-45 top-1/2 -translate-y-1/2 rounded-full" />
        </div>
    </div>
);

const CheckMark = ({ color = "text-primary" }: { color?: string }) => (
    <div className={cn("w-5 h-5 rounded-full bg-current/10 flex items-center justify-center border border-current/20", color)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    </div>
);

export default function UpgradePage() {
    const { subscription, subscribe } = useSubscription();
    const { user } = useAuth();
    const router = useRouter();
    const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("yearly");

    const handleSubscribe = (plan: "monthly" | "yearly") => {
        if (!user) {
            router.push('/login');
            return;
        }
        subscribe(plan, false);
    };

    return (
        <div className="min-h-screen text-white selection:bg-primary/30 relative overflow-x-hidden">
            <div className="sticky top-0 z-[100]">
                <AppHeader activeTool="Upgrade" />
            </div>
            
            {/* Background Glows (Subtle theme-aware overlays) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full opacity-50" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full opacity-50" />
                <div className="absolute -bottom-[10%] left-[20%] w-[70%] h-[70%] bg-accent/10 blur-[150px] rounded-full opacity-30" />
                
                {/* Vector Texture Overlay (Tagda Look) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
                />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-24">
                {/* Header */}
                <div className="text-center space-y-6 mb-20">
                    <div className="flex flex-col items-center">
                        <Badge variant="outline" className="px-4 py-1 border-primary/30 bg-primary/5 text-primary mb-4 animate-subtle-glow">
                            <Crown className="w-3 h-3 mr-2" />
                            Premium Excellence
                        </Badge>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20 leading-tight"
                        >
                            Architect Your <br /> Future with Ultra
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-8 font-light leading-relaxed"
                        >
                            Transcend traditional limitations. Deploy a comprehensive suite of intelligence tools engineered for professionals who define excellence.
                        </motion.p>
                    </div>
                </div>

                {/* Pricing Cards - 3 Tier Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-32 items-end">
                    {/* Free Plan */}
                    <Card className="bg-white/[0.02] border-white/10 backdrop-blur-xl relative overflow-hidden group h-fit">
                        <CardHeader className="pb-8">
                            <CardTitle className="text-xl font-medium text-muted-foreground">Standard</CardTitle>
                            <div className="flex items-baseline gap-1 mt-4">
                                <span className="text-5xl font-bold">₹0</span>
                                <span className="text-muted-foreground">/forever</span>
                            </div>
                            <CardDescription className="mt-4">Basic utility for general tasks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="space-y-4">
                                {[
                                    "5 Daily Executions",
                                    "Standard Engine Access",
                                    "Basic Drafting Tools",
                                    "Community Support",
                                    "High-Latency Exports"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground/80">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-8">
                            <Button variant="outline" className="w-full border-white/10 bg-white/5" disabled>
                                Current Tier
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Premium Pro Plan (Monthly) */}
                    <Card className="bg-white/[0.03] border-white/20 backdrop-blur-2xl relative overflow-hidden group h-fit border-t-blue-500/50">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                        <CardHeader className="pb-8">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-medium text-blue-400">Premium Pro</CardTitle>
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Monthly</Badge>
                            </div>
                            <div className="flex items-baseline gap-1 mt-4">
                                <span className="text-5xl font-bold">₹29</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <CardDescription className="mt-4">Strategic access for specific workflows.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="space-y-4">
                                {[
                                    "Unlimited Executions",
                                    "Total Feature Access",
                                    "Professional Clean Exports",
                                    "Tier-1 Priority Support",
                                    "Zero-Ad Interface"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm">
                                        <Check className="w-4 h-4 text-blue-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-8">
                            <Button 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                onClick={() => handleSubscribe("monthly")}
                            >
                                Activate Pro
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Premium Ultra (Yearly) */}
                    <Card className="bg-white/[0.05] border-primary/50 backdrop-blur-3xl relative overflow-hidden group scale-105 shadow-[0_0_80px_hsl(var(--primary)/0.15)] border-t-primary">
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                            Most Strategic
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
                        
                        <CardHeader className="pb-8">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                    <Crown className="w-6 h-6 text-amber-400" />
                                    Premium Ultra
                                </CardTitle>
                                <Badge className="bg-primary/20 text-primary border-primary/30">Yearly</Badge>
                            </div>
                            <div className="flex items-baseline gap-1 mt-4">
                                <span className="text-6xl font-black">₹199</span>
                                <span className="text-muted-foreground">/year</span>
                            </div>
                            <CardDescription className="mt-4 text-white/70">The ultimate ecosystem for power users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Ultra-Exclusive Utilities:</p>
                                <ul className="space-y-3">
                                    {features.slice(0, 4).map((f) => (
                                        <li key={f.title} className="flex items-center gap-3 text-sm">
                                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span className="font-semibold">{f.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <ul className="space-y-4">
                                {additionalPerks.slice(0, 4).map((perk) => (
                                    <li key={perk} className="flex items-center gap-3 text-sm text-white/80">
                                        <Check className="w-4 h-4 text-primary shrink-0" />
                                        {perk}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-8">
                            <Button 
                                className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_hsl(var(--primary)/0.5)] h-14 text-xl font-black rounded-xl group-hover:scale-[1.02] transition-transform"
                                onClick={() => handleSubscribe("yearly")}
                            >
                                DEPLOY ULTRA
                                <Rocket className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Feature Showcase */}
                <div className="space-y-20 mb-32">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Enterprise Infrastructure</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Scalable solutions to architect, analyze, and execute high-stakes documents.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3", feature.bg)}>
                                    <feature.icon className={cn("w-7 h-7", feature.color)} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Comparison Table - Tagda Version */}
                <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden mb-32 backdrop-blur-md">
                    <div className="p-10 border-b border-white/10 bg-white/[0.02]">
                        <h2 className="text-3xl font-bold tracking-tight">Comparison</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-muted-foreground border-b border-white/10">
                                    <th className="p-8 font-medium">Feature</th>
                                    <th className="p-8 font-medium">Starter</th>
                                    <th className="p-8 font-medium text-blue-400">Premium Pro</th>
                                    <th className="p-8 font-medium text-primary">Premium Ultra</th>
                                </tr>
                            </thead>
                            <tbody className="text-base">
                                {[
                                    { name: "Daily Executions", free: "5", premium: "Unlimited", pro: "Unlimited" },
                                    { name: "Intelligence Engine", free: "Standard", premium: "Advanced", pro: "L-Series (Max)" },
                                    { name: "8K Visual Pipeline", free: "2K", premium: "4K High", pro: "8K Ultra HD" },
                                    { name: "Executive Suite", free: "Basic", premium: "Pro Suite", pro: "Pro Suite + Neural" },
                                    { name: "Academic Architect", free: false, premium: true, pro: true },
                                    { name: "Project Blueprints", free: false, premium: true, pro: true },
                                    { name: "Neural Script OCR", free: "Basic", premium: "Advanced", pro: "Elite Neural" },
                                    { name: "Strategic Support", free: "Standard", premium: "Tier-1", pro: "24/7 Concierge" },
                                    { name: "Interface", free: "Ad-Supported", premium: "Ad-Free", pro: "Ad-Free" },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-8 font-medium text-white/90">{row.name}</td>
                                        <td className="p-8 text-muted-foreground">
                                            {row.free === true ? <CheckMark color="text-white/40" /> : row.free === false ? <CrossMark /> : row.free}
                                        </td>
                                        <td className="p-8 text-blue-400/80 font-medium">
                                            {row.premium === true ? <CheckMark color="text-blue-400" /> : row.premium === false ? <CrossMark /> : row.premium}
                                        </td>
                                        <td className="p-8 text-primary font-bold">
                                            {row.pro === true ? <CheckMark color="text-primary" /> : row.pro === false ? <CrossMark /> : row.pro}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="text-center space-y-10 py-20 border-t border-white/10 relative">
                    <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm font-black tracking-widest uppercase">
                        <Star className="w-4 h-4 fill-current" />
                        Executive offer: Save 40% on Yearly
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Ready to Deploy Ultra?</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button 
                            size="lg" 
                            className="bg-primary hover:bg-primary/90 text-white px-16 h-16 text-xl font-black rounded-2xl shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
                            onClick={() => handleSubscribe("yearly")}
                        >
                            COMMIT TO ULTRA
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="lg" 
                            className="text-muted-foreground hover:text-white text-lg"
                            onClick={() => router.back()}
                        >
                            Return to Standard
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-12 pt-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-2 font-medium"><Shield className="w-6 h-6" /> Tier-1 SSL Security</div>
                        <div className="flex items-center gap-2 font-medium"><Award className="w-6 h-6" /> 7-Day Asset Protection</div>
                        <div className="flex items-center gap-2 font-medium"><Zap className="w-6 h-6" /> Instant Activation</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
