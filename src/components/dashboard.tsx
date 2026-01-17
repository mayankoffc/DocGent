
"use client";

import * as React from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, User, ScanText, ArrowRight, ClipboardPen, FileSignature, BookOpenCheck, DraftingCompass, FileEdit, LucideIcon, Layers, File, Crown, CheckCircle, ChevronDown, PenSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RadialMenu } from "./radial-menu";
import { cn } from "@/lib/utils";
import { useRecentGenerations, AnyRecentGeneration } from "@/hooks/use-recent-generations";
import { RecentGenerationItem } from "./recent-generation-item";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { NativeAdBanner } from "./native-ad-banner";
import { premiumTools, freemiumTools } from "@/config/subscriptions";
import { Badge } from "./ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "./ui/skeleton";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'editor' | 'watermark-adder' | 'handwriting';

export const tools: {
    nameKey: string;
    descriptionKey: string;
    icon: LucideIcon;
    tool: Tool;
    color: string;
    bgColor: string;
    gradient: string;
}[] = [
    { nameKey: "docsToolName", descriptionKey: "docsToolDescription", icon: FileText, tool: "docs", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", gradient: "from-purple-500 to-indigo-600" },
    { nameKey: "watermarkAdderToolName", descriptionKey: "watermarkAdderToolDescription", icon: Layers, tool: "watermark-adder", color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", gradient: "from-cyan-500 to-teal-600" },
    { nameKey: "examToolName", descriptionKey: "examToolDescription", icon: ClipboardPen, tool: "exam", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", gradient: "from-blue-500 to-sky-600" },
    { nameKey: "notesToolName", descriptionKey: "notesToolDescription", icon: FileSignature, tool: "notes", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", gradient: "from-green-500 to-emerald-600" },
    { nameKey: "editorToolName", descriptionKey: "editorToolDescription", icon: FileEdit, tool: "editor", color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", gradient: "from-indigo-500 to-violet-600" },
    { nameKey: "solverToolName", descriptionKey: "solverToolDescription", icon: BookOpenCheck, tool: "solver", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", gradient: "from-yellow-500 to-amber-600" },
    { nameKey: "blueprintToolName", descriptionKey: "blueprintToolDescription", icon: DraftingCompass, tool: "blueprint", color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30", gradient: "from-sky-400 to-blue-500" },
    { nameKey: "resumeToolName", descriptionKey: "resumeToolDescription", icon: User, tool: "resume", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", gradient: "from-orange-400 to-red-500" },
    { nameKey: "analyzerToolName", descriptionKey: "analyzerToolDescription", icon: ScanText, tool: "analyzer", color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30", gradient: "from-pink-500 to-rose-500" },
    { nameKey: "handwritingToolName", descriptionKey: "handwritingToolDescription", icon: PenSquare, tool: "handwriting", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", gradient: "from-red-500 to-orange-600" },
];

export function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const { recentGenerations } = useRecentGenerations();
    const { setToolState } = useToolState(null);
    const { t } = useTranslation();
    const { subscription, loading: subscriptionLoading } = useSubscription();
    const [showAllGenerations, setShowAllGenerations] = React.useState(false);
    const router = useRouter();

    const displayedGenerations = showAllGenerations ? recentGenerations : recentGenerations.slice(0, 3);

    const isPremiumUser = subscription.status === 'active' || subscription.status === 'trial';
    const isFreemiumUser = subscription.status === 'freemium';

    const handleViewGeneration = (item: AnyRecentGeneration) => {
        (setToolState as any)(item.type, item.data);
        router.push(`/tool/${item.type}`);
    };

    if (authLoading) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="text-left">
                <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-bold font-headline text-foreground">
                        {t('dashboardHello', { name: user?.displayName || user?.email?.split('@')[0] || t('guest') })}
                    </h1>
                     {subscriptionLoading ? (
                        <Skeleton className="w-8 h-8 rounded-full" />
                     ) : isPremiumUser ? (
                        <Crown className="w-8 h-8 text-yellow-500 animate-crown-glow animate-shine" fill="currentColor" />
                    ) : isFreemiumUser ? (
                        <Crown className="w-8 h-8 text-blue-500 animate-blue-crown-glow animate-shine" fill="currentColor" />
                    ) : null}
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('dashboardLetsCreate')}
                </p>
            </div>
            
            <div className="relative">
                <Card className="lg:col-span-2 bg-[rgba(20,20,20,0.7)] backdrop-blur-2xl text-white p-8 flex flex-col justify-between rounded-3xl min-h-[200px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
                   {/* Glass shine effect */}
                   <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                   <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                   
                   <div className="relative z-10">
                     <h2 className="text-3xl font-bold font-headline bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">{t('dashboardAiContentGenerator')}</h2>
                     <p className="mt-2 text-white/60 max-w-lg">{t('dashboardGeneratorDescription')}</p>
                   </div>
                   <div className="mt-8 relative z-10">
                        <Link href="/tool/docs" passHref>
                          <Button className="bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 hover:border-white/20">
                              {t('dashboardGetStarted')} <ArrowRight className="ml-2 w-4 h-4"/>
                          </Button>
                        </Link>
                   </div>
                </Card>
            </div>

            {recentGenerations.length > 0 && (
                 <div className="pt-8">
                    <h2 className="text-2xl font-bold font-headline text-foreground mb-4">{t('dashboardRecentGenerations')}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                         {displayedGenerations.map((item) => (
                           <RecentGenerationItem key={item.id} item={item} onSelect={handleViewGeneration}/>
                        ))}
                    </div>
                    {recentGenerations.length > 3 && (
                        <div className="mt-4 text-center">
                            <Button variant="ghost" onClick={() => setShowAllGenerations(!showAllGenerations)}>
                                {showAllGenerations ? t('showLess') : t('showAll')}
                                <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showAllGenerations && "rotate-180")} />
                            </Button>
                        </div>
                    )}
                 </div>
            )}
            
            <div className="pt-8">
                 <h2 className="text-2xl font-bold font-headline text-foreground mb-4">{t('dashboardQuickTools')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tools.map((tool) => {
                        const isPremium = premiumTools.includes(tool.tool as any);
                        const isFreemium = freemiumTools.includes(tool.tool as any);
                        const hasFreemiumAccess = isFreemiumUser || isPremiumUser;

                        return (
                        <Link href={`/tool/${tool.tool}`} key={tool.tool} passHref>
                          <Card className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 relative h-full bg-[rgba(20,20,20,0.6)] backdrop-blur-xl border-white/[0.08] hover:bg-[rgba(30,30,30,0.7)] hover:border-white/[0.12]">
                              {isPremium && (
                                isPremiumUser ? (
                                    <Badge variant="secondary" className="badge-glossy absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-md z-10">
                                        <CheckCircle className="w-3 h-3 mr-1"/>
                                        {t('unlocked')}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="badge-glossy absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-none shadow-md z-10">
                                        <Crown className="w-3 h-3 mr-1"/>
                                        {t('premium')}
                                    </Badge>
                                )
                            )}
                             {isFreemium && !isPremium && (
                                hasFreemiumAccess ? (
                                    <Badge variant="secondary" className="badge-glossy absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-md z-10">
                                        <CheckCircle className="w-3 h-3 mr-1"/>
                                        {t('unlocked')}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="badge-glossy absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-md z-10">
                                        <Crown className="w-3 h-3 mr-1"/>
                                        {t('freemium')}
                                    </Badge>
                                )
                            )}
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-32">
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110", tool.bgColor)}>
                                    <tool.icon className={cn("w-6 h-6", tool.color)} />
                                </div>
                                <h3 className="text-sm font-semibold">{t(tool.nameKey as any)}</h3>
                            </CardContent>
                          </Card>
                        </Link>
                    )})}
                </div>
            </div>
            
            <div className="pt-8 text-center">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RadialMenu tools={tools} />
                </div>
            </div>
            <NativeAdBanner />
        </div>
    );
}
