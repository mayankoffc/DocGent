
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnyRecentGeneration, useRecentGenerations } from "@/hooks/use-recent-generations";
import { formatDistanceToNow } from 'date-fns';
import { FileText, User, ScanText, BarChartHorizontal, ClipboardPen, FileSignature, BookOpenCheck, DraftingCompass, PenSquare, FileEdit, Eye, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

interface RecentGenerationItemProps {
    item: AnyRecentGeneration;
    onSelect: (item: AnyRecentGeneration) => void;
}

const getIcon = (type: AnyRecentGeneration['type']) => {
    switch (type) {
        case 'docs': return <FileText className="w-6 h-6 text-purple-500" />;
        case 'exam': return <ClipboardPen className="w-6 h-6 text-blue-500" />;
        case 'notes': return <FileSignature className="w-6 h-6 text-green-500" />;
        case 'editor': return <FileEdit className="w-6 h-6 text-indigo-500" />;
        case 'solver': return <BookOpenCheck className="w-6 h-6 text-yellow-500" />;
        case 'blueprint': return <DraftingCompass className="w-6 h-6 text-sky-500" />;
        case 'resume': return <User className="w-6 h-6 text-orange-500" />;
        case 'analyzer': return <ScanText className="w-6 h-6 text-pink-500" />;
        case 'upscaler': return <Sparkles className="w-6 h-6 text-teal-500" />;
        default: return <FileText className="w-6 h-6 text-gray-500" />;
    }
};

const getToolName = (type: AnyRecentGeneration['type']) => {
     const nameMap = {
        docs: 'Document',
        exam: 'Exam Paper',
        notes: 'Short Notes',
        editor: 'Edited Document',
        solver: 'Solved Booklet',
        blueprint: 'Project Blueprint',
        resume: 'Resume',
        analyzer: 'Analysis',
        upscaler: 'Upscaled Image',
    };
    return nameMap[type as keyof typeof nameMap] || 'Generation';
}

export function RecentGenerationItem({ item, onSelect }: RecentGenerationItemProps) {
    const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    const { deleteRecentGeneration } = useRecentGenerations();
    const { toast } = useToast();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteRecentGeneration(item.id);
        toast({
            title: "Generation Deleted",
            description: "The item has been removed from your recent generations.",
        });
    };

    return (
        <Card 
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
            onClick={() => onSelect(item)}
        >
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg shrink-0">
                    {getIcon(item.type)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-base leading-snug truncate">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{timeAgo} &bull; {getToolName(item.type)}</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="mt-auto flex justify-end gap-2 p-2 pt-0">
                <AlertDialog onOpenChange={(e) => e.valueOf()}>
                    <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this generation from your history.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
