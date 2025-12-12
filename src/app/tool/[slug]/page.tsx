
"use client";

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';

import { Dashboard } from '@/components/dashboard';
import { DocumentGenerator } from '@/components/document-generator';
import { ResumeGenerator } from '@/components/resume-generator';
import { DocumentAnalyzer } from '@/components/document-analyzer';
import { DocumentConverter } from '@/components/document-converter';
import { ExamPaperGenerator } from '@/components/exam-paper-generator';
import { ShortNotesGenerator } from '@/components/short-notes-generator';
import { BookletSolver } from '@/components/booklet-solver';
import { SettingsPage } from '@/components/settings';
import { ProjectBlueprintGenerator } from '@/components/project-blueprint-generator';
import { ProfessionalDocumentEditor } from '@/components/professional-document-editor';
import { SubscriptionModal } from '@/components/subscription-modal';
import { WatermarkAdder } from '@/components/watermark-adder';
import { HandwritingConverter } from '@/components/handwriting-converter';

export default function ToolPage() {
  const params = useParams<{ slug: string }>();
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  // A simple function to render the component based on the slug.
  const renderTool = () => {
    switch (params.slug) {
      case 'dashboard':
        return <Dashboard />;
      case 'docs':
        return <DocumentGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'resume':
        return <ResumeGenerator />;
      case 'analyzer':
        return <DocumentAnalyzer />;
      case 'converter':
        return <DocumentConverter />;
      case 'handwriting':
        return <HandwritingConverter setSubscriptionModalOpen={setSubscriptionModalOpen}/>;
      case 'exam':
        return <ExamPaperGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'notes':
        return <ShortNotesGenerator setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'solver':
        return <BookletSolver setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'blueprint':
        return <ProjectBlueprintGenerator />;
      case 'editor':
        return <ProfessionalDocumentEditor setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'watermark-adder':
        return <WatermarkAdder setSubscriptionModalOpen={setSubscriptionModalOpen} />;
      case 'settings':
        return <SettingsPage />;
      default:
        // If the slug doesn't match any tool, show a 404 page.
        notFound();
    }
  };

  return (
    <>
      {renderTool()}
      {/* The SubscriptionModal is kept here so it can be triggered from any tool page */}
      <SubscriptionModal isOpen={isSubscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} />
    </>
  );
}
