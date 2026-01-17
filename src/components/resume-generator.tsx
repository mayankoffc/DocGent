
"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, CloudUpload, FileDown, FileX2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getUserPageDimensions, formatBytes } from "@/lib/pdf-optimizer";


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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateResume, GenerateResumeInput, GenerateResumeOutput } from "@/ai/flows/generate-resume";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { uploadToGoogleDrive } from "@/services/storage";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useRecentGenerations } from "@/hooks/use-recent-generations";


const formSchema = z.object({
  skills: z.string().min(10, {
    message: "Skills section must not be empty.",
  }),
  experience: z.string().min(20, {
    message: "Experience section must not be empty.",
  }),
});

export function ResumeGenerator() {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const { user, getAccessToken, signIn } = useAuth();
    const resumeRef = useRef<HTMLDivElement>(null);
    const { getToolState, setToolState } = useToolState<GenerateResumeOutput>('resume');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();
    const { t } = useTranslation();


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            skills: "",
            experience: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setToolState(null);
        try {
            const output = await generateResume(values as GenerateResumeInput);
            setToolState(output);
            addRecentGeneration({
                type: 'resume',
                title: 'Resume Draft',
                data: output,
                formValues: values,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('toastResumeError'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        const contentToCapture = resumeRef.current;
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
        
        // Apply compression
        const compressionQuality = (() => {
            const compression = localStorage.getItem('pdfCompression') || 'medium';
            switch(compression) {
                case 'none': return 1.0;
                case 'low': return 0.95;
                case 'medium': return 0.85;
                case 'high': return 0.75;
                case 'maximum': return 0.6;
                default: return 0.85;
            }
        })();
        
        const imgData = canvas.toDataURL('image/jpeg', compressionQuality);
        
        // Use user's page settings
        const userPageDimensions = getUserPageDimensions();
        const defaultOrientation = localStorage.getItem('defaultOrientation') || 'portrait';
        
        const pdf = new jsPDF(defaultOrientation === 'landscape' ? 'l' : 'p', 'px', [userPageDimensions.width, userPageDimensions.height]);

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
            pdf.addImage(imgData, 'JPEG', 0, yPos, pdfWidth, canvasHeightInPdf);
        }
        return pdf.output('blob');
    };

    const handleDownload = async () => {
        toast({ title: t('toastPreparingDownloadTitle'), description: t('toastResumePDFDescription') });
        const blob = await generatePdfBlob();
        if (blob) {
            const sizeMB = blob.size / (1024 * 1024);
            const maxSizeMB = parseInt(localStorage.getItem('maxDownloadSize') || '10');
            
            if (sizeMB > maxSizeMB) {
                toast({
                    title: 'Warning',
                    description: `PDF size (${formatBytes(blob.size)}) exceeds limit (${maxSizeMB}MB)`,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: 'Success',
                    description: `Resume generated (${formatBytes(blob.size)})`,
                });
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: t('toastDownloadCompleteTitle'), description: t('toastResumeDownloadComplete') });
        }
    };
    
    const handleSaveToCloud = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: t('toastLoginRequiredTitle'),
                description: t('toastLoginRequiredDescription'),
                action: <Button onClick={() => signIn('', '')}>Sign In</Button>
            });
            return;
        }
        
        const accessToken = await getAccessToken();
        if (!accessToken) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Could not get Google access token. Please sign in again.",
                action: <Button onClick={() => signIn('', '')}>Sign In</Button>
            });
            return;
        }

        setIsUploading(true);
        toast({
            title: t('toastUploadingCloudTitle'),
            description: t('toastResumeUploading'),
        });

        try {
            const blob = await generatePdfBlob();
            if (!blob) {
                 throw new Error("Failed to generate PDF blob for upload.");
            }
            const fileName = `Resume_${new Date().toISOString()}.pdf`;
            const driveFile = await uploadToGoogleDrive(accessToken, fileName, blob, "application/pdf");

            toast({
                title: t('toastCloudSuccessTitle'),
                description: t('toastResumeCloudSuccess'),
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
                description: t('toastResumeUploadFailed'),
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (result && !isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('resumeResultTitle')}</CardTitle>
                            <CardDescription>{t('resumeResultDescription')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveToCloud} disabled={isUploading}>
                                <CloudUpload className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload}>
                                <FileDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    
                    <div ref={resumeRef} className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap bg-background p-4 rounded-md border">
                        {result.resumeDraft}
                    </div>
                    <Button onClick={() => setToolState(null)} variant="outline" className="w-full mt-4">
                        <FileX2 className="mr-2 h-4 w-4" />
                        {t('resumeAnotherButton')}
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
                        <CardTitle>{t('resumeToolName')}</CardTitle>
                        <CardDescription>
                            {t('resumeToolDescriptionLong')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="skills"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('resumeSkillsLabel')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('resumeSkillsPlaceholder')}
                                                    className="min-h-[120px]"
                                                    {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('resumeSkillsDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="experience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('resumeExperienceLabel')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('resumeExperiencePlaceholder')}
                                                    className="min-h-[150px]"
                                                    {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('resumeExperienceDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? t('resumeGeneratingButton') : t('resumeGenerateButton')}
                                    <Sparkles className="ml-2 w-4 h-4" />
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('resumeResultTitle')}</CardTitle>
                        <CardDescription>{t('resumeResultDescriptionEmpty')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                            {isLoading && (
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <br/>
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <br/>
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            )}
                            {!result && !isLoading && (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    {t('resumeResultPlaceholder')}
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}
