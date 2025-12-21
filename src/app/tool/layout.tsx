
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ScanText,
  User,
  HomeIcon,
  Cog,
  LogOut,
  ClipboardPen,
  FileSignature,
  BookOpenCheck,
  DraftingCompass,
  FileEdit,
  Crown,
  Loader2,
  Layers,
  File,
  PenSquare,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { SubscriptionModal } from '@/components/subscription-modal';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    const isGuest = sessionStorage.getItem('isGuest') === 'true';
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && typeof window !== 'undefined' && sessionStorage.getItem('isGuest') !== 'true')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isPremiumUser = subscription.status === 'active' || subscription.status === 'trial';
  const isFreemiumUser = subscription.status === 'freemium';

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">DOC AI</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={params.slug === 'dashboard'} tooltip="Dashboard">
                  <Link href="/tool/dashboard">
                    <HomeIcon />
                    <span className='font-headline'>Home</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'docs'} tooltip="Document Generator">
                <Link href="/tool/docs">
                  <FileText />
                  <span className='font-headline'>Documents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton asChild isActive={params.slug === 'watermark-adder'} tooltip="Watermark Adder">
                <Link href="/tool/watermark-adder">
                    <Layers />
                    <span className='font-headline'>Add Watermark</span>
                </Link>
               </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'exam'} tooltip="Exam Paper Generator">
                <Link href="/tool/exam">
                  <ClipboardPen />
                  <span className='font-headline'>Exam Papers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'notes'} tooltip="Short Notes Generator">
                <Link href="/tool/notes">
                  <FileSignature />
                  <span className='font-headline'>Short Notes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={params.slug === 'handwriting'} tooltip="AI Handwritten Notes">
                    <Link href="/tool/handwriting">
                        <PenSquare />
                        <span className='font-headline'>Handwritten</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'editor'} tooltip="AI Document Editor">
                <Link href="/tool/editor">
                  <FileEdit />
                  <span className='font-headline'>AI Editor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'solver'} tooltip="Booklet Solver">
                <Link href="/tool/solver">
                  <BookOpenCheck />
                  <span className='font-headline'>Booklet Solver</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'blueprint'} tooltip="Project Blueprints">
                <Link href="/tool/blueprint">
                  <DraftingCompass />
                  <span className='font-headline'>Blueprints</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'resume'} tooltip="Resume Generator">
                <Link href="/tool/resume">
                  <User />
                  <span className='font-headline'>Resumes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'analyzer'} tooltip="Document Analyzer">
                <Link href="/tool/analyzer">
                  <ScanText />
                  <span className='font-headline'>Analyzer</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={params.slug === 'converter'} tooltip="Document Converter">
                <Link href="/tool/converter">
                    <File />
                    <span className='font-headline'>Converter</span>
                </Link>
               </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSubscriptionModalOpen(true)}
                className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 backdrop-blur-md transition-all"
                tooltip="Upgrade to Premium"
              >
                <Crown />
                <span className='font-headline'>Upgrade</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <Separator />
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton asChild isActive={params.slug === 'settings'} tooltip="Settings">
                <Link href="/tool/settings">
                  <Cog />
                  <span className="font-headline">Settings</span>
                </Link>
               </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-3 mx-2 mb-2 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06]">
            <Avatar>
              <AvatarImage src={user?.photoURL || "https://placehold.co/40x40"} data-ai-hint="user avatar" />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'G'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{user?.displayName || user?.email || "Guest User"}</span>
                     {subscriptionLoading ? (
                        <Skeleton className="w-4 h-4 rounded-full" />
                     ) : user && isPremiumUser ? (
                        <Crown className="w-4 h-4 text-yellow-500 animate-crown-glow animate-shine shrink-0" fill="currentColor" />
                    ) : user && isFreemiumUser ? (
                        <Crown className="w-4 h-4 text-blue-500 animate-blue-crown-glow animate-shine shrink-0" fill="currentColor" />
                    ) : null}
                </div>
              <span className="text-xs text-muted-foreground truncate">{user?.email || "Explore as a guest"}</span>
            </div>
            {user && (
              <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto shrink-0">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-svh">
            <AppHeader activeTool={params.slug} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-24">
                {children}
            </main>
        </div>
      </SidebarInset>
      <AiAssistant setSubscriptionModalOpen={setSubscriptionModalOpen} />
      <SubscriptionModal isOpen={isSubscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} />
    </SidebarProvider>
  );
}
