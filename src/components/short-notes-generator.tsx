
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileSignature, Wand2, Loader2, CloudUpload, FileDown, Printer, FileX2, FileUp } from "lucide-react";
import { marked } from "marked";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateShortNotes, GenerateShortNotesInput, GenerateShortNotesOutput } from "@/ai/flows/generate-short-notes";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { uploadToGoogleDrive } from "@/services/storage";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useRecentGenerations } from "@/hooks/use-recent-generations";


const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  pdfFile: z.any().refine(file => file instanceof File, "Please upload a PDF file."),
  detailLevel: z.enum(['concise', 'detailed', 'comprehensive']).default('detailed'),
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ShortNotesGenerator({ setSubscriptionModalOpen }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { user, getAccessToken, signIn } = useAuth();
    const notesRef = useRef<HTMLDivElement>(null);
    const { getToolState, setToolState } = useToolState<GenerateShortNotesOutput>('notes');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();
    const { t } = useTranslation();
    const [fileName, setFileName] = useState<string>("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            detailLevel: "detailed",
        },
    });

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
        toast({ title: "File Ready", description: `${file.name} is ready for note generation.`});
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!values.pdfFile) {
            toast({ variant: 'destructive', title: 'PDF Missing', description: 'Please upload a document to summarize.' });
            return;
        }
        setIsLoading(true);
        setToolState(null);
        try {
            const pdfDataUri = await fileToDataUri(values.pdfFile);
            const input: GenerateShortNotesInput = {
                pdfDataUri,
                detailLevel: values.detailLevel,
            };

            const output = await generateShortNotes(input);
            setToolState(output);
            addRecentGeneration({
                type: 'notes',
                title: `Notes: ${values.pdfFile.name}`,
                data: output,
                formValues: values,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('toastNotesError'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        const contentToCapture = notesRef.current;
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
    };

    const handleDownload = async () => {
        toast({ title: t('toastPreparingDownloadTitle'), description: t('toastNotesPDFDescription') });
        const blob = await generatePdfBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'short-notes.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: t('toastDownloadCompleteTitle'), description: t('toastNotesDownloadComplete') });
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
            description: t('toastNotesUploading'),
        });

        try {
            const blob = await generatePdfBlob();
            if (!blob) {
                 throw new Error("Failed to generate PDF blob for upload.");
            }
            const fileName = `Short_Notes_${fileName || 'Document'}_${new Date().toISOString()}.pdf`;
            const driveFile = await uploadToGoogleDrive(accessToken, fileName, blob, "application/pdf");

            toast({
                title: t('toastCloudSuccessTitle'),
                description: t('toastNotesCloudSuccess'),
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
                description: t('toastNotesUploadFailed'),
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handlePrint = async () => {
        if (!notesRef.current) return;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Notes</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; } .prose { max-width: 100%; } h2, h3 { margin-top: 1.5em; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(notesRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const generatedHtml = result ? marked.parse(result.shortNotes) : "";

    if (result && !isLoading) {
         return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('notesResultTitle')}</CardTitle>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveToCloud} disabled={isUploading}>
                                <CloudUpload className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload}>
                                <FileDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <CardDescription>{t('notesResultDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    
                    <ScrollArea className="h-[60vh] w-full rounded-md border">
                        <div className="p-4 bg-white dark:bg-card">
                            <div ref={notesRef}>
                                <div 
                                    className="prose prose-sm sm:prose-base max-w-none dark:prose-invert p-4"
                                    dangerouslySetInnerHTML={{ __html: generatedHtml }}
                                />
                            </div>
                        </div>
                    </ScrollArea>
                     <Button onClick={() => setToolState(null)} variant="outline" className="w-full mt-4">
                        <FileX2 className="mr-2 h-4 w-4" />
                        {t('notesAnotherButton')}
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
                        <CardTitle>{t('notesToolName')}</CardTitle>
                        <CardDescription>
                            {t('notesToolDescriptionLong')}
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
                                            <FormDescription>{t('notesContentDescription')}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               
                                <FormField
                                    control={form.control}
                                    name="detailLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('notesDetailLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('notesDetailPlaceholder')} />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="concise">{t('notesDetailConcise')}</SelectItem>
                                                <SelectItem value="detailed">{t('notesDetailDetailed')}</SelectItem>
                                                <SelectItem value="comprehensive">{t('notesDetailComprehensive')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {t('notesDetailDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? t('notesGeneratingButton') : t('notesGenerateButton')}
                                    <Wand2 className="ml-2 w-4 h-4" />
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('notesResultTitle')}</CardTitle>
                        <CardDescription>{t('notesResultDescriptionEmpty')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ScrollArea className="h-full w-full rounded-md border">
                            <div className="p-4 bg-white dark:bg-card">
                                {isLoading && (
                                    <div className="space-y-4 p-4">
                                        <Skeleton className="h-6 w-1/3" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <br/>
                                        <Skeleton className="h-6 w-1/2" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                )}
                                {!isLoading && !result && (
                                    <div className="w-full h-full flex items-center justify-center text-center text-muted-foreground p-8">
                                        <div>
                                            <FileSignature className="w-12 h-12 mx-auto mb-4" />
                                            <p>{t('notesResultPlaceholder')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}

