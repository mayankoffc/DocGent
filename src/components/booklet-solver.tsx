
"use client";

import { useState, ChangeEvent, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BookOpenCheck, Wand2, Loader2, Printer, FileDown, CloudUpload, FileX2, FileUp } from "lucide-react";
import { marked } from "marked";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import katex from 'katex';
import 'katex/dist/katex.min.css';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { solveBooklet, SolveBookletInput, SolveBookletOutput } from "@/ai/flows/booklet-solver";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuth } from "@/hooks/use-auth";
import { uploadToGoogleDrive } from "@/services/storage";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useRecentGenerations } from "@/hooks/use-recent-generations";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { WritingAnimation } from "./writing-animation";


const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  pdfFile: z.any().refine(file => file instanceof File, "Please upload a PDF file."),
  detailLevel: z.enum(['short', 'medium', 'detailed']).default('detailed'),
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function BookletSolver({ setSubscriptionModalOpen }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { user, getAccessToken, signIn } = useAuth();
    const answerKeyRef = useRef<HTMLDivElement>(null);
    const { getToolState, setToolState } = useToolState<SolveBookletOutput>('solver');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();
    const { t } = useTranslation();
    const [fileName, setFileName] = useState<string>("");

    useEffect(() => {
        GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;
    }, []);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            detailLevel: "detailed",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!values.pdfFile) {
            toast({ variant: 'destructive', title: 'PDF Missing', description: 'Please upload a booklet to solve.' });
            return;
        }

        setIsLoading(true);
        setToolState(null);
        try {
            const pdfDataUri = await fileToDataUri(values.pdfFile);
            const input: SolveBookletInput = {
                pdfDataUri,
                detailLevel: values.detailLevel,
            };
            const output = await solveBooklet(input);
            setToolState(output);
            addRecentGeneration({
                type: 'solver',
                title: `Solved: ${values.pdfFile.name}`,
                data: output,
                formValues: values,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('toastSolverError'),
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: t('toastInvalidFileTypeTitle'), description: t('toastInvalidFileTypeDescription') });
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload a PDF smaller than 50MB.' });
            return;
        }

        setFileName(file.name);
        form.setValue('pdfFile', file);
        setToolState(null); // Clear previous results
        toast({ title: "File Ready", description: `${file.name} is ready for solving.`});
    };

    const renderKaTeX = (html: string) => {
        const katexRegex = /\$\$([\s\S]*?)\$\$/g;
        const renderedHtml = html.replace(katexRegex, (match, katexString) => {
            try {
                return katex.renderToString(katexString, {
                    throwOnError: false,
                    displayMode: true,
                });
            } catch (e) {
                console.error("KaTeX rendering error:", e);
                return match; // Return the original string on error
            }
        });
        return renderedHtml;
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        const contentToCapture = answerKeyRef.current;
        if (!contentToCapture) {
            toast({ title: t('error'), description: t('toastPDFGenerationError'), variant: "destructive" });
            return null;
        }

        const canvas = await html2canvas(contentToCapture, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => element.classList.contains('ignore-in-pdf'),
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'px', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let canvasHeightInPdf = pdfWidth / ratio;
        let totalPages = Math.ceil(canvasHeightInPdf / pdfHeight);

        for (let i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();
            let yPos = -i * pdfHeight;
            pdf.addImage(imgData, 'PNG', 0, yPos, pdfWidth, canvasHeightInPdf);
        }
        return pdf.output('blob');
    }

    const handleDownload = async () => {
        toast({ title: t('toastPreparingDownloadTitle'), description: t('toastSolverPDFDescription') });
        const blob = await generatePdfBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'solved-answer-key.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: t('toastDownloadCompleteTitle'), description: t('toastSolverDownloadComplete') });
        }
    };
    
    const handleSaveToCloud = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: t('toastLoginRequiredTitle'),
                description: t('toastLoginRequiredDescription'),
                action: <Button onClick={signIn}>Sign In</Button>
            });
            return;
        }

        const accessToken = await getAccessToken();
        if (!accessToken) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Could not get Google access token. Please sign in again.",
                action: <Button onClick={signIn}>Sign In</Button>
            });
            return;
        }


        setIsUploading(true);
        toast({
            title: t('toastUploadingCloudTitle'),
            description: t('toastSolverUploading'),
        });

        try {
            const blob = await generatePdfBlob();
            if (!blob) {
                 throw new Error("Failed to generate PDF blob for upload.");
            }
            const fileName = `Solved_${fileName || 'Booklet'}_${new Date().toISOString()}.pdf`;
            const driveFile = await uploadToGoogleDrive(accessToken, fileName, blob, "application/pdf");
            
            toast({
                title: t('toastCloudSuccessTitle'),
                description: t('toastSolverCloudSuccess'),
                action: (
                    <a href={driveFile.webViewLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">View File</Button>
                    </a>
                )
            });
        } catch (error) {
             console.error("Cloud upload failed:", error);
            toast({
                variant: "destructive",
                title: t('toastUploadFailedTitle'),
                description: t('toastSolverUploadFailed'),
            });
        } finally {
            setIsUploading(false);
        }
    };


    const handlePrint = () => {
        if (!answerKeyRef.current) return;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Answer Key</title>');
            const katexStyles = Array.from(document.styleSheets)
                .filter(sheet => sheet.href && sheet.href.includes('katex'))
                .map(sheet => `<link rel="stylesheet" href="${sheet.href}">`)
                .join('');
            printWindow.document.write(katexStyles);
            printWindow.document.write('<style>body { font-family: sans-serif; } .prose { max-width: 100%; } h2, h3 { margin-top: 1.5em; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(answerKeyRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const generatedHtml = result ? renderKaTeX(marked.parse(result.solvedAnswers)) : "";

    if (result && !isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{t('solverResultTitle')}</CardTitle>
                            <CardDescription>{t('solverResultDescription')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveToCloud} disabled={isUploading}>
                                <CloudUpload className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload}><FileDown className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    
                    <ScrollArea className="h-[60vh] w-full rounded-md border">
                        <div className="p-4 bg-white dark:bg-card">
                            <div ref={answerKeyRef}>
                                <div 
                                    className="prose prose-sm sm:prose-base max-w-none dark:prose-invert p-4"
                                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                                />
                            </div>
                        </div>
                    </ScrollArea>
                    <Button onClick={() => setToolState(null)} variant="outline" className="w-full mt-4">
                        <FileX2 className="mr-2 h-4 w-4" />
                        {t('solverAnotherButton')}
                    </Button>
                    
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('solverToolName')}</CardTitle>
                        <CardDescription>
                           {t('solverToolDescriptionLong')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                 <FormField
                                    control={form.control}
                                    name="pdfFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('solverUploadPDFLabel')}</FormLabel>
                                             <div className="relative flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="pdf-upload"
                                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                                                        {fileName ? (
                                                             <p className="font-semibold text-primary">{fileName}</p>
                                                        ) : (
                                                            <>
                                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                                <p className="text-xs text-muted-foreground">PDF (MAX. 50MB)</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                                    </FormControl>
                                                </label>
                                            </div>
                                            <FormDescription>{t('solverUploadDescription')}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <FormField
                                    control={form.control}
                                    name="detailLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('solverDetailLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('solverDetailPlaceholder')} />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="short">{t('solverDetailShort')}</SelectItem>
                                                <SelectItem value="medium">{t('solverDetailMedium')}</SelectItem>
                                                <SelectItem value="detailed">{t('solverDetailDetailed')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {t('solverDetailDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? t('solverSolvingButton') : t('solverSolveButton')}
                                    {isLoading ? <Loader2 className="ml-2 w-4 h-4 animate-spin"/> : <Wand2 className="ml-2 w-4 h-4" />}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('solverResultTitle')}</CardTitle>
                        <CardDescription>{t('solverResultDescriptionEmpty')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center min-h-0">
                        {isLoading && (
                            <WritingAnimation />
                        )}
                        {!isLoading && !result && (
                            <div className="w-full h-full flex items-center justify-center text-center text-muted-foreground p-8">
                                <div>
                                    <BookOpenCheck className="w-12 h-12 mx-auto mb-4" />
                                    <p>{t('solverResultPlaceholder')}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}

    
