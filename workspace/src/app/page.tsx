
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ScanText,
  User,
  Home as HomeIcon,
  Cog,
  BarChartHorizontal,
  LogOut,
  FolderArchive,
  ClipboardPen,
  FileSignature,
  BookOpenCheck,
  DraftingCompass,
  PenSquare,
  FileEdit,
  Crown,
  Loader2,
  Layers,
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
import { Dashboard } from '@/components/dashboard';
import { DocumentGenerator } from '@/components/document-generator';
import { ResumeGenerator } from '@/components/resume-generator';
import { DocumentAnalyzer } from '@/components/document-analyzer';
import { IllustrationGenerator } from '@/components/illustration-generator';
import { ExamPaperGenerator } from '@/components/exam-paper-generator';
import { ShortNotesGenerator } from '@/components/short-notes-generator';
import { BookletSolver } from '@/components/booklet-solver';
import { AppHeader } from '../../../src/components/header';
import { SettingsPage } from '@/components/settings';
import { AiAssistant } from '@/components/ai-assistant';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ProjectBlueprintGenerator } from '@/components/project-blueprint-generator';
import { HandwritingConverter } from '@/components/handwriting-converter';
import { ProfessionalDocumentEditor } from '@/components/professional-document-editor';
import { SubscriptionModal } from '@/components/subscription-modal';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { premiumTools, freemiumTools } from '@/config/subscriptions';
import { WatermarkAdder } from '@/components/watermark-adder';


type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'settings' | 'illustrations' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'handwriting' | 'editor' | 'watermark-adder';

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>('dashboard');
  const { user, signOut, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleToolSelection = (tool: Tool) => {
    const isPremium = premiumTools.includes(tool);
    const isFreemium = freemiumTools.includes(tool);
    
    const hasPremiumAccess = subscription.status === 'active' || subscription.status === 'trial';
    const hasFreemiumAccess = hasPremiumAccess || subscription.status === 'freemium';

    if (isPremium && !hasPremiumAccess) {
      setSubscriptionModalOpen(true);
    } else if (isFreemium && !hasFreemiumAccess) {
      setSubscriptionModalOpen(true);
    }
    else {
      setActiveTool(tool);
    }
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'dashboard':
        return <Dashboard setActiveTool={handleToolSelection} setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'docs':
        return <DocumentGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'resume':
        return <ResumeGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'analyzer':
        return <DocumentAnalyzer setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'illustrations':
        return <IllustrationGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'exam':
        return <ExamPaperGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'notes':
        return <ShortNotesGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'solver':
        return <BookletSolver setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'blueprint':
        return <ProjectBlueprintGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'handwriting':
        return <HandwritingConverter setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'editor':
        return <ProfessionalDocumentEditor setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'watermark-adder':
        return <WatermarkAdder setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard setActiveTool={handleToolSelection} setSubscriptionModalOpen={setSubscriptionModalOpen} />;
    }
  };

  if (authLoading || !user) {
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
              <SidebarMenuButton
                onClick={() => setActiveTool('dashboard')}
                isActive={activeTool === 'dashboard'}
                tooltip="Dashboard"
              >
                <HomeIcon/>
                <span className='font-headline'>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('docs')}
                isActive={activeTool === 'docs'}
                tooltip="Document Generator"
              >
                <FileText />
                <span className='font-headline'>Documents</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('watermark-adder')}
                isActive={activeTool === 'watermark-adder'}
                tooltip="Watermark Adder"
              >
                <Layers />
                <span className='font-headline'>Add Watermark</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('exam')}
                isActive={activeTool === 'exam'}
                tooltip="Exam Paper Generator"
              >
                <ClipboardPen />
                <span className='font-headline'>Exam Papers</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('notes')}
                isActive={activeTool === 'notes'}
                tooltip="Short Notes Generator"
              >
                <FileSignature />
                <span className='font-headline'>Short Notes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('handwriting')}
                isActive={activeTool === 'handwriting'}
                tooltip="AI Handwritten Notes"
              >
                <PenSquare />
                <span className='font-headline'>Handwritten</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('editor')}
                isActive={activeTool === 'editor'}
                tooltip="AI Document Editor"
              >
                <FileEdit />
                <span className='font-headline'>AI Editor</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('solver')}
                isActive={activeTool === 'solver'}
                tooltip="Booklet Solver"
              >
                <BookOpenCheck />
                <span className='font-headline'>Booklet Solver</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('blueprint')}
                isActive={activeTool === 'blueprint'}
                tooltip="Project Blueprints"
              >
                <DraftingCompass />
                <span className='font-headline'>Blueprints</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('resume')}
                isActive={activeTool === 'resume'}
                tooltip="Resume Generator"
              >
                <User />
                <span className='font-headline'>Resumes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('analyzer')}
                isActive={activeTool === 'analyzer'}
                tooltip="Document Analyzer"
              >
                <ScanText />
                <span className='font-headline'>Analyzer</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleToolSelection('illustrations')}
                isActive={activeTool === 'illustrations'}
                tooltip="Illustration Studio"
              >
                <BarChartHorizontal />
                <span className='font-headline'>Illustrations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSubscriptionModalOpen(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90"
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
                    <SidebarMenuButton
                        onClick={() => setActiveTool('settings')}
                        isActive={activeTool === 'settings'}
                        tooltip="Settings"
                    >
                        <Cog />
                        <span className="font-headline">Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-3">
            <Avatar>
              <AvatarImage src={user?.photoURL || "https://placehold.co/40x40"} data-ai-hint="user avatar" />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{user?.displayName || user?.email || "Guest"}</span>
                     {subscriptionLoading ? (
                        <Skeleton className="w-4 h-4 rounded-full" />
                     ) : isPremiumUser ? (
                        <Crown className="w-4 h-4 text-yellow-500 animate-crown-glow animate-shine shrink-0" fill="currentColor" />
                    ) : isFreemiumUser ? (
                        <Crown className="w-4 h-4 text-blue-500 animate-blue-crown-glow animate-shine shrink-0" fill="currentColor" />
                    ) : null}
                </div>
              <span className="text-xs text-muted-foreground truncate">{user?.email || "user@doc.ai"}</span>
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
            <AppHeader activeTool={activeTool} setActiveTool={setActiveTool} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-24">
                {renderTool()}
            </main>
        </div>
      </SidebarInset>
      <AiAssistant setSubscriptionModalOpen={setSubscriptionModalOpen} />
      <SubscriptionModal isOpen={isSubscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} />
    </SidebarProvider>
  );
}
