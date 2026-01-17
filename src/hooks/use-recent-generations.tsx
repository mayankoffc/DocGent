
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Import all possible output types from your flows
import type { GenerateDocumentOutput, GenerateDocumentInput } from "@/ai/flows/generate-document";
import type { GenerateExamPaperOutput, GenerateExamPaperInput } from "@/ai/flows/exam-paper-generator";
import type { GenerateShortNotesOutput, GenerateShortNotesInput } from "@/ai/flows/generate-short-notes";
import type { SolveBookletOutput, SolveBookletInput } from "@/ai/flows/booklet-solver";
import type { GenerateProjectBlueprintOutput, GenerateProjectBlueprintInput } from "@/ai/flows/generate-project-blueprint";
import type { ProfessionalDocumentEditorOutput, ProfessionalDocumentEditorInput } from "@/ai/flows/professional-document-editor";
import type { GenerateResumeOutput, GenerateResumeInput } from "@/ai/flows/generate-resume";
import type { AnalyzeDocumentOutput, AnalyzeDocumentInput } from "@/ai/flows/analyze-document";
import { AddWatermarkOutput, AddWatermarkInput } from "@/ai/flows/add-watermark";
import { HandwritingConverterOutput, HandwritingConverterInput } from '@/ai/flows/handwriting-converter';
import { ConvertDocumentOutput, ConvertDocumentInput } from '@/ai/flows/convert-document';


const MAX_RECENT_ITEMS = 8;
const STORAGE_KEY = 'recentGenerations';

// Define a base structure for a recent generation item
interface BaseRecentGeneration<T extends string, D, F> {
    id: string;
    type: T;
    title: string;
    timestamp: number;
    data: D;
    formValues: F;
}

// Create specific types for each tool's generation
export type DocumentGeneration = BaseRecentGeneration<'docs', GenerateDocumentOutput, GenerateDocumentInput>;
export type ExamPaperGeneration = BaseRecentGeneration<'exam', GenerateExamPaperOutput, GenerateExamPaperInput>;
export type ShortNotesGeneration = BaseRecentGeneration<'notes', GenerateShortNotesOutput, GenerateShortNotesInput>;
export type BookletSolverGeneration = BaseRecentGeneration<'solver', SolveBookletOutput, SolveBookletInput>;
export type BlueprintGeneration = BaseRecentGeneration<'blueprint', GenerateProjectBlueprintOutput, GenerateProjectBlueprintInput>;
export type EditorGeneration = BaseRecentGeneration<'editor', ProfessionalDocumentEditorOutput, ProfessionalDocumentEditorInput>;
export type ResumeGeneration = BaseRecentGeneration<'resume', GenerateResumeOutput, GenerateResumeInput>;
export type AnalyzerGeneration = BaseRecentGeneration<'analyzer', AnalyzeDocumentOutput, AnalyzeDocumentInput>;
export type WatermarkGeneration = BaseRecentGeneration<'watermark-adder', AddWatermarkOutput, AddWatermarkInput>;
export type ConverterGeneration = BaseRecentGeneration<'converter', ConvertDocumentOutput, ConvertDocumentInput>;
export type HandwritingGeneration = BaseRecentGeneration<'handwriting', HandwritingConverterOutput, HandwritingConverterInput>;


// Union type for any possible generation
export type AnyRecentGeneration =
    | DocumentGeneration
    | ExamPaperGeneration
    | ShortNotesGeneration
    | BookletSolverGeneration
    | BlueprintGeneration
    | EditorGeneration
    | ResumeGeneration
    | AnalyzerGeneration
    | WatermarkGeneration
    | ConverterGeneration
    | HandwritingGeneration;

interface RecentGenerationsContextType {
    recentGenerations: AnyRecentGeneration[];
    addRecentGeneration: (item: Omit<AnyRecentGeneration, 'id' | 'timestamp'>) => void;
    deleteRecentGeneration: (id: string) => void;
}

const RecentGenerationsContext = createContext<RecentGenerationsContextType | undefined>(undefined);

export const RecentGenerationsProvider = ({ children }: { children: ReactNode }) => {
    const [recentGenerations, setRecentGenerations] = useState<AnyRecentGeneration[]>([]);
    
    useEffect(() => {
        try {
            const storedItems = localStorage.getItem(STORAGE_KEY);
            if (storedItems) {
                setRecentGenerations(JSON.parse(storedItems));
            }
        } catch (error) {
            console.error("Failed to parse recent generations from localStorage", error);
            setRecentGenerations([]);
        }
    }, []);
    
    const saveToStorage = (items: AnyRecentGeneration[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error("Failed to save recent generations to localStorage", error);
        }
    }

    const addRecentGeneration = (item: Omit<AnyRecentGeneration, 'id' | 'timestamp'>) => {
        const newItem: AnyRecentGeneration = {
            ...item,
            id: `${item.type}-${Date.now()}`,
            timestamp: Date.now(),
        } as AnyRecentGeneration;

        setRecentGenerations(prev => {
            const updated = [newItem, ...prev].slice(0, MAX_RECENT_ITEMS);
            saveToStorage(updated);
            return updated;
        });
    };
    
    const deleteRecentGeneration = (id: string) => {
        setRecentGenerations(prev => {
            const updated = prev.filter(item => item.id !== id);
            saveToStorage(updated);
            return updated;
        })
    }
    
    const value = { recentGenerations, addRecentGeneration, deleteRecentGeneration };

    return (
        <RecentGenerationsContext.Provider value={value}>
            {children}
        </RecentGenerationsContext.Provider>
    );
};

export const useRecentGenerations = () => {
    const context = useContext(RecentGenerationsContext);
    if (context === undefined) {
        throw new Error('useRecentGenerations must be used within a RecentGenerationsProvider');
    }
    return context;
};
