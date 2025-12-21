
"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileEdit, Wand2, Loader2, FileUp, FileX2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { editDocument, ProfessionalDocumentEditorOutput } from "@/ai/flows/professional-document-editor";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useRecentGenerations } from "@/hooks/use-recent-generations";
import { useSubscription } from "@/hooks/use-subscription";
import { isPremiumTool } from "@/config/subscriptions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Crown } from "lucide-react";
import { GeminiIcon } from "@/components/icons";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Skeleton } from "./ui/skeleton";
import { GlobalWorkerOptions } from 'pdfjs-dist';


const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  pdfFile: z.any().optional(),
  originalText: z.string().min(1, "Please provide some text to edit, either by typing or uploading a PDF."),
  editPrompt: z.string().min(5, { message: "Prompt must be at least 5 characters." }),
});

interface ProfessionalDocumentEditorProps {
    setSubscriptionModalOpen: (isOpen: boolean) => void;
}

export function ProfessionalDocumentEditor({ setSubscriptionModalOpen }: ProfessionalDocumentEditorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { getToolState, setToolState } = useToolState<ProfessionalDocumentEditorOutput>('editor');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();
    const { t } = useTranslation();
    const { subscription } = useSubscription();
    const isPremium = isPremiumTool('editor');
    const hasAccess = !isPremium || subscription.status === 'active' || subscription.status === 'trial';

    const [fileName, setFileName] = useState<string>("");

    useEffect(() => {
        // Set workerSrc for pdfjs-dist on the client side to avoid SSR issues.
        // This is necessary because it relies on the 'window' object.
        GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            originalText: "",
            editPrompt: "Improve clarity and fix grammatical errors.",
        },
    });

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a valid PDF file.' });
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload a PDF smaller than 50MB.' });
            return;
        }

        form.setValue('pdfFile', file);
        setFileName(file.name);
        setToolState(null); // Clear previous results

        toast({ title: 'Processing PDF...', description: 'Extracting text from your document.' });
        try {
            const text = await extractTextFromPdf(file);
            form.setValue('originalText', text, { shouldValidate: true });
            toast({ title: 'Success!', description: 'PDF content has been extracted and loaded.' });
        } catch (error) {
            console.error(error);
            form.setError('originalText', { message: 'Failed to extract text from this PDF.' });
            toast({ variant: 'destructive', title: 'PDF Error', description: 'Could not read text from the uploaded PDF. Please try another file.' });
        }
    };


    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!hasAccess) {
            setSubscriptionModalOpen(true);
            return;
        }
        setIsLoading(true);
        setToolState(null);
        try {
            const output = await editDocument({
                originalText: values.originalText,
                editPrompt: values.editPrompt,
            });
            setToolState(output);
            addRecentGeneration({
                type: 'editor',
                title: `Edited: ${values.originalText.substring(0, 40)}...`,
                data: output,
                formValues: values,
            });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: t('error'), description: t('toastEditorError') });
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>AI Document Editor</CardTitle>
                        <CardDescription>Upload a PDF or paste text, provide an editing prompt, and let the AI revise it for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasAccess && (
                            <Alert className="mb-6">
                                <Crown className="h-4 w-4" />
                                <AlertTitle>Premium Feature</AlertTitle>
                                <AlertDescription>This is a premium tool. Please upgrade to use it.</AlertDescription>
                                <Button className="mt-4 w-full" onClick={() => setSubscriptionModalOpen(true)}>
                                    <Crown className="mr-2 h-4 w-4" /> Upgrade to Premium
                                </Button>
                            </Alert>
                        )}
                        <fieldset disabled={!hasAccess || isLoading}>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="originalText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Original Text</FormLabel>
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Paste your original text here, or upload a PDF to extract text."
                                                        className="min-h-[200px] text-sm pr-10"
                                                        {...field} value={field.value || ''}
                                                    />
                                                     <label htmlFor="pdf-upload" className="absolute bottom-2 right-2 cursor-pointer text-muted-foreground hover:text-primary p-2 rounded-md bg-background/50 hover:bg-muted">
                                                        <FileUp className="h-5 w-5" />
                                                    </label>
                                                    <FormControl>
                                                        <Input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                                    </FormControl>
                                                </div>
                                                <FormDescription>Max file size: {MAX_FILE_SIZE / (1024*1024)}MB. Uploaded PDF text will appear here.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                     <FormField
                                        control={form.control}
                                        name="editPrompt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 relative">
                                                    <GeminiIcon className="w-6 h-6 icon-glow" />
                                                    Provide Editing Instructions
                                                </FormLabel>
                                                <div className="glowing-border rounded-lg">
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="e.g., Make the tone more professional and correct any grammatical errors."
                                                            className="min-h-[140px] bg-background text-base"
                                                            {...field} value={field.value || ''}
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={isLoading} className="w-full">
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        {isLoading ? "Editing with AI..." : "Edit Text with AI"}
                                    </Button>
                                </form>
                            </Form>
                        </fieldset>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Edited Result</CardTitle>
                        <CardDescription>The revised content from the AI will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[40vh] border-2 border-dashed rounded-lg p-4">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ) : result?.editedContent ? (
                            <pre className="whitespace-pre-wrap font-sans text-sm">{result.editedContent}</pre>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Your edited text will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

