
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, Copy, Printer, Eye, Info, X, FileDown, BookType, StretchHorizontal, FileOutput, Gem, Type, Palette, BookOpen, ImageIcon, Wand2, MonitorPlay, CloudUpload, Crown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { optimizePDF, getUserPageDimensions, formatBytes, getCompressionRatio } from "@/lib/pdf-optimizer";

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
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateDocument, GenerateDocumentInput, GenerateDocumentOutput } from "@/ai/flows/generate-document";
import { Slider } from "@/components/ui/slider";
import { PrintingAnimation } from "./printing-animation";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { GeminiIcon } from "@/components/icons";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Switch } from "./ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { uploadToGoogleDrive } from "@/services/storage";
import { useRecentGenerations } from "@/hooks/use-recent-generations";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useSubscription } from "@/hooks/use-subscription";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


const standardFonts = [
    { name: 'Roboto', className: 'font-roboto' },
    { name: 'Open Sans', className: 'font-open-sans' },
    { name: 'Lato', className: 'font-lato' },
    { name: 'Montserrat', className: 'font-montserrat' },
    { name: 'Merriweather', className: 'font-merriweather' },
    { name: 'Playfair Display', className: 'font-playfair-display' },
    { name: 'Nunito', className: 'font-nunito' },
    { name: 'Raleway', className: 'font-raleway' },
    { name: 'Source Code Pro', className: 'font-source-code-pro' },
    { name: 'Lora', className: 'font-lora' },
    { name: 'PT Sans', className: 'font-pt-sans' },
    { name: 'Poppins', className: 'font-poppins' }
];

const handwritingFonts = [
    { name: 'Caveat', className: 'font-caveat' },
    { name: 'Dancing Script', className: 'font-dancing-script' },
    { name: 'Patrick Hand', className: 'font-patrick-hand' },
    { name: 'Indie Flower', className: 'font-indie-flower' }
];

const allFonts = [...standardFonts, ...handwritingFonts];

const fontEnum = z.enum([
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Merriweather',
    'Playfair Display',
    'Nunito',
    'Raleway',
    'Source Code Pro',
    'Lora',
    'PT Sans',
    'Poppins',
    'Caveat',
    'Dancing Script',
    'Patrick Hand',
    'Indie Flower'
]);

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  documentType: z.enum(['essay', 'report', 'letter', 'meeting-agenda', 'project-proposal', 'presentation', 'timetable']).default('essay'),
  format: z.enum(['PDF', 'DOCX', 'TXT']).default('PDF'),
  pageSize: z.enum(['A4', 'A3', 'A5']).default('A4'),
  pageCount: z.number().min(1).max(30),
  qualityLevel: z.enum(['medium', 'high', 'ultra']).default('high'),
  font: fontEnum.default('Roboto'),
  theme: z.enum(['professional', 'creative', 'minimalist']).default('professional'),
  numImages: z.number().min(0).max(15).default(0),
  generateTemplate: z.boolean().default(true),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface DocumentGeneratorProps {
    setSubscriptionModalOpen: (isOpen: boolean) => void;
}

export function DocumentGenerator({ setSubscriptionModalOpen }: DocumentGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("Initializing...");
    const { toast } = useToast();
    const { user, getAccessToken, signIn } = useAuth();
    const { addRecentGeneration } = useRecentGenerations();
    const { getToolState, setToolState } = useToolState<GenerateDocumentOutput>('docs');
    const result = getToolState();
    const { t } = useTranslation();
    const { subscription, refreshSubscription } = useSubscription();
    const isPremiumUser = subscription.status === 'active' || subscription.status === 'trial';
    
    const [viewerOpen, setViewerOpen] = useState(false);
    const isGuest = !user;

    const remainingImages = isPremiumUser ? 15 : Math.max(0, 10 - subscription.imageGenerationCount);
    const isQuotaExceeded = !isPremiumUser && remainingImages <= 0;


    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: "",
            documentType: "essay",
            format: "PDF",
            pageSize: "A4",
            pageCount: 1,
            qualityLevel: "high",
            font: "Roboto",
            theme: "professional",
            numImages: 0,
            generateTemplate: true,
        },
    });

    const selectedFormat = form.watch('format');
    const documentType = form.watch('documentType');
    const isPresentation = documentType === 'presentation';
    const isTimetable = documentType === 'timetable';
    const isRichFormat = selectedFormat !== 'TXT';

    useEffect(() => {
        const numImagesField = form.getValues("numImages");
        if (numImagesField > remainingImages) {
            form.setValue("numImages", remainingImages);
        }
    }, [remainingImages, form]);

    const promptPlaceholders: Record<string, string> = {
        'essay': t('docgenPromptPlaceholderEssay'),
        'report': t('docgenPromptPlaceholderReport'),
        'letter': t('docgenPromptPlaceholderLetter'),
        'meeting-agenda': t('docgenPromptPlaceholderAgenda'),
        'project-proposal': t('docgenPromptPlaceholderProposal'),
        'presentation': t('docgenPromptPlaceholderPresentation'),
        'timetable': t('docgenPromptPlaceholderTimetable'),
        'default': t('docgenPromptPlaceholderDefault')
    }

    async function onSubmit(values: FormSchemaType) {
        // Check for premium features on submission
        const isUsingPremiumFeatures =
            values.format !== 'PDF' ||
            values.pageSize !== 'A4' ||
            values.qualityLevel === 'ultra';

        if (isUsingPremiumFeatures && !isPremiumUser) {
            setSubscriptionModalOpen(true);
            return;
        }


        setIsLoading(true);
        setToolState(null);
        
        const updateProgress = (value: number, label: string) => {
            setProgress(value);
            setProgressLabel(label);
        };
        
        updateProgress(10, t('docgenProgressWarmup'));

        try {
            updateProgress(30, t('docgenProgressGenerating'));
            const output = await generateDocument({
                ...values,
                userId: user?.uid,
                subscription: subscription
            });
            
            updateProgress(100, t('docgenProgressReady'));
            setToolState(output);
            
            addRecentGeneration({
                type: 'docs',
                title: values.prompt.substring(0, 50) + '...',
                data: output,
                formValues: values,
            });
            
            await refreshSubscription(); // Refresh subscription to get updated image count
            setViewerOpen(true);
            
        } catch (error: any) {
            console.error(error);
            updateProgress(0, t('error'));
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.message || t('toastDocGenError'),
            });
        } finally {
            setIsLoading(false);
        }
    }


    const handleCopy = () => {
        if (!result) return;
        const textContent = result.pages.map(page => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = page.content;
            return tempDiv.textContent || tempDiv.innerText || '';
        }).join('\n\n');

        navigator.clipboard.writeText(textContent);
        toast({
            title: t('toastCopiedTitle'),
            description: t('toastDocGenCopied'),
        });
    }

    const handlePrint = () => {
        const printableArea = document.getElementById('printable-area');
        if (!printableArea) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({ title: t('error'), description: t('toastDocGenPrintWindowError'), variant: "destructive" });
            return;
        }

        const formValues = form.getValues();
        const fontName = formValues.font || 'Roboto';
        const googleFontLink = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
        
        const contentToPrint = printableArea.innerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>${t('docgenPrintTitle')}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link rel="stylesheet" href="${googleFontLink}">
                    <script src="https://cdn.tailwindcss.com"><\/script>
                    <style>
                        body { font-family: '${fontName}', sans-serif; }
                        @page { size: ${formValues.pageSize || 'A4'}; margin: 1in; }
                        .page-container {
                            display: flex;
                            flex-direction: column;
                            gap: 2rem;
                        }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                         img {
                            max-height: 300px;
                            margin: 1rem auto;
                            border-radius: 0.5rem;
                            background-color: white;
                            padding: 0.5rem;
                         }
                         .document-page {
                             page-break-after: always;
                             box-shadow: none !important;
                             border: 1px solid #ddd;
                         }
                    </style>
                </head>
                <body>
                    <div class="page-container">${contentToPrint}</div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        if (!result) return null;
         const container = document.getElementById('printable-area');
        if (!container) {
            toast({ title: t('error'), description: t('toastPDFGenerationError'), variant: "destructive" });
            return null;
        }

        const pageElements = Array.from(container.children).filter(el => el.id.startsWith('page-')) as HTMLElement[];
        if (pageElements.length === 0) {
            toast({ title: t('error'), description: t('docgenNoPagesToConvert'), variant: "destructive" });
            return null;
        }
        
        let orientation: "p" | "l" = 'p';
        
        // Get user's default orientation from settings
        const defaultOrientation = localStorage.getItem('defaultOrientation') || 'portrait';
        
        if (result.isPresentation) {
                orientation = 'l';
        } else {
                // Use user's preferred orientation if set
                orientation = defaultOrientation === 'landscape' ? 'l' : 'p';
                // Or auto-detect from content
                const autoOrientation = pageElements[0].clientWidth > pageElements[0].clientHeight ? 'l' : 'p';
                if (!localStorage.getItem('defaultOrientation')) {
                    orientation = autoOrientation;
                }
        }
        
        // Get page size from form values (not localStorage)
        const formValues = form.getValues();
        const selectedPageSize = formValues.pageSize || 'A4';
        
        // Get proper page dimensions based on form selection
        const pageSizeDimensions: Record<string, { width: number; height: number }> = {
            'A4': { width: 595, height: 842 },   // 210 x 297 mm
            'A3': { width: 842, height: 1191 },  // 297 x 420 mm
            'A5': { width: 420, height: 595 },   // 148 x 210 mm
        };
        
        const selectedDimensions = pageSizeDimensions[selectedPageSize] || pageSizeDimensions['A4'];
        
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'pt',
            format: result.isPresentation ? 'a4' : [selectedDimensions.width, selectedDimensions.height],
        });


        for (let i = 0; i < pageElements.length; i++) {
            const page = pageElements[i];
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: result.theme.backgroundColor,
                ignoreElements: (element) => element.classList.contains('ignore-in-pdf'),
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            if (i > 0) {
                pdf.addPage([pdfWidth, pdfHeight], orientation);
            }
            
            // Apply image quality based on compression settings
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
            
            // Convert canvas to JPEG with compression for better file size
            const compressedImgData = canvas.toDataURL('image/jpeg', compressionQuality);
            pdf.addImage(compressedImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
        
        return pdf.output('blob');
    }
    
    const handleDownload = async () => {
        if (!result) return;
        const formValues = form.getValues();
        const selectedFormat = formValues.format || 'PDF';
        const documentType = formValues.documentType || 'document';

        toast({
            title: t('toastPreparingDownloadTitle'),
            description: t('toastDocGenPreparing', { documentType: t(`docgenDocType${documentType.charAt(0).toUpperCase() + documentType.slice(1)}` as any), format: selectedFormat }),
        });

        if (selectedFormat === 'PDF') {
            const blob = await generatePdfBlob();
            if (blob) {
                const originalSize = blob.size;
                const maxSizeMB = parseInt(localStorage.getItem('maxDownloadSize') || '10');
                const sizeMB = originalSize / (1024 * 1024);
                
                // Check size limit
                if (sizeMB > maxSizeMB) {
                    toast({
                        title: t('warning') || 'Warning',
                        description: `PDF size (${formatBytes(originalSize)}) exceeds limit (${maxSizeMB}MB). Consider using higher compression.`,
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: t('success') || 'Success',
                        description: `PDF generated successfully (${formatBytes(originalSize)})`,
                    });
                }
                
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${documentType}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            return;
        }

        // Fallback for DOCX and TXT
        let fileContent = '';
        let fileType = '';
        let fileExtension = '';

        if (selectedFormat === 'TXT') {
            fileContent = result.pages.map(page => {
                 const tempDiv = document.createElement('div');
                 tempDiv.innerHTML = page.content;
                 return tempDiv.textContent || tempDiv.innerText || '';
            }).join('\n\n---\n\n');
            fileType = 'text/plain;charset=utf-8';
            fileExtension = 'txt';
        } else { // DOCX
             const fontName = formValues.font || 'Roboto';
            const googleFontLink = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
            
            const contentHtml = result.pages.map(page => {
                const tempDiv = document.createElement('div');
                Object.assign(tempDiv.style, {
                    width: '100%',
                    maxWidth: '8.5in',
                    margin: '2rem auto',
                    padding: '2rem 2.5rem',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    backgroundColor: result.theme.backgroundColor,
                    color: result.theme.textColor,
                    borderImageSource: result.theme.backgroundImageDataUri ? `url(${result.theme.backgroundImageDataUri})` : 'none',
                    borderImageSlice: '20',
                    borderImageWidth: '20px',
                    borderImageRepeat: 'repeat',
                    borderStyle: 'solid',
                    borderColor: 'transparent',
                    pageBreakAfter: 'always',
                });
                tempDiv.innerHTML = page.content;
                return tempDiv.outerHTML;
            }).join('');

            fileContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${documentType}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link rel="stylesheet" href="${googleFontLink}">
                    <style>
                        body { 
                            font-family: '${fontName}', sans-serif; 
                            font-size: 12pt;
                            background-color: #f0f0f0; 
                            margin: 0; 
                            padding: 1rem;
                        }
                        h1, h2, h3, h4, h5, h6 { font-weight: bold; }
                        h1 { font-size: 22pt; color: ${result.theme.headingColor}; } 
                        h2 { font-size: 18pt; color: ${result.theme.headingColor}; } 
                        h3 { font-size: 14pt; color: ${result.theme.headingColor}; }
                        p { margin: 0 0 1em 0; }
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        img { max-width: 100%; height: auto; border-radius: 8px; }
                        @page { size: ${formValues.pageSize || 'A4'}; }
                        .document-page {
                             page-break-after: always;
                             box-shadow: none !important;
                             border: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    ${contentHtml}
                </body>
                </html>
            `;
            fileType = 'text/html;charset=utf-8';
            fileExtension = 'doc';
        }

        const blob = new Blob([fileContent], { type: fileType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${documentType}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
            title: t('toastDownloadCompleteTitle'),
            description: t('toastDocGenDownloadComplete', { extension: fileExtension }),
        });
    };
    
    const handleSaveToGoogleDrive = async () => {
        if (!result) return;
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
                action: <Button onClick={() => signIn('', '')}>Sign In</Button>
            });
            return;
        }


        setIsUploading(true);
        toast({
            title: t('toastUploadingCloudTitle'),
            description: t('toastDocGenUploading'),
        });

        try {
            const blob = await generatePdfBlob();
            if (!blob) {
                 throw new Error("Failed to generate PDF blob for upload.");
            }
            
            const docType = form.getValues('documentType');
            const promptStart = form.getValues('prompt').substring(0, 20).replace(/\s/g, '_');
            const fileName = `${docType}_${promptStart}_${new Date().toISOString()}.pdf`;
            
            const driveFile = await uploadToGoogleDrive(accessToken, fileName, blob, "application/pdf");
            
            toast({
                title: t('toastCloudSuccessTitle'),
                description: t('toastDocGenCloudSuccess'),
                action: (
                    <a href={driveFile.webViewLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">{t('view')}</Button>
                    </a>
                )
            });
        } catch (error) {
             console.error("Cloud upload failed:", error);
            toast({
                variant: "destructive",
                title: t('toastUploadFailedTitle'),
                description: t('toastDocGenUploadFailed'),
            });
        } finally {
            setIsUploading(false);
        }
    };
    const pageSizeClasses = {
        'A4': 'aspect-[1/1.414]',
        'A3': 'aspect-[1.414/1]',
        'A5': 'aspect-[1/1.414]',
    };

    const fontClasses: {[key: string]: string} = allFonts.reduce((acc, font) => {
        acc[font.name] = font.className;
        return acc;
    }, {} as {[key: string]: string});
    
    const pages = result?.pages || [];
    const formValues = form.getValues();

    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('docgenTitle')}</CardTitle>
                        <CardDescription>
                            {t('docgenDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <fieldset disabled={isLoading} className="space-y-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="documentType"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel className="flex items-center gap-2"><BookType /> {t('docgenTypeLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenTypePlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="essay">{t('docgenDocTypeEssay')}</SelectItem>
                                                <SelectItem value="report">{t('docgenDocTypeReport')}</SelectItem>
                                                <SelectItem value="letter">{t('docgenDocTypeLetter')}</SelectItem>
                                                <SelectItem value="meeting-agenda">{t('docgenDocTypeMeetingAgenda')}</SelectItem>
                                                <SelectItem value="project-proposal">{t('docgenDocTypeProjectProposal')}</SelectItem>
                                                <SelectItem value="presentation">{t('docgenDocTypePresentation')}</SelectItem>
                                                <SelectItem value="timetable">{t('docgenDocTypeTimetable')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {t('docgenTypeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2 relative">
                                                <div className="shooting-stars">
                                                    <div className="star"></div>
                                                    <div className="star"></div>
                                                    <div className="star"></div>
                                                </div>
                                                <GeminiIcon className="w-8 h-8 icon-glow" />
                                                {t('docgenPromptLabel')}
                                            </FormLabel>
                                            <div className="glowing-border">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={promptPlaceholders[documentType] || promptPlaceholders['default']}
                                                        className="min-h-[120px] bg-background"
                                                        {...field} value={field.value || ''} />
                                                </FormControl>
                                            </div>
                                            <FormDescription>
                                                {t('docgenPromptDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", isTimetable && "hidden")}>
                                    <FormField
                                        control={form.control}
                                        name="pageSize"
                                        render={({ field }) => (
                                            <FormItem className={cn((isPresentation || isTimetable) && "hidden")}>
                                            <FormLabel className="flex items-center gap-2"><StretchHorizontal /> {t('docgenPageSizeLabel')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isRichFormat}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenPageSizePlaceholder')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="A4">
                                                        <span className="flex items-center justify-between w-full">
                                                            A4 (Freemium) <Crown className="w-4 h-4 ml-2 text-blue-500"/>
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="A3" disabled={!isPremiumUser} onSelect={(e) => {if (!isPremiumUser) {e.preventDefault(); setSubscriptionModalOpen(true);}}}>
                                                        <span className="flex items-center justify-between w-full">
                                                            A3 <Crown className="w-4 h-4 ml-2 text-yellow-500"/>
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="A5" disabled={!isPremiumUser} onSelect={(e) => {if (!isPremiumUser) {e.preventDefault(); setSubscriptionModalOpen(true);}}}>
                                                        <span className="flex items-center justify-between w-full">
                                                            A5 <Crown className="w-4 h-4 ml-2 text-yellow-500"/>
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="format"
                                        render={({ field }) => (
                                            <FormItem className={cn((isPresentation || isTimetable) && "hidden")}>
                                            <FormLabel className="flex items-center gap-2"><FileOutput /> {t('docgenFormatLabel')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenFormatPlaceholder')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PDF">
                                                         <span className="flex items-center justify-between w-full">
                                                            PDF (Freemium) <Crown className="w-4 h-4 ml-2 text-blue-500"/>
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="DOCX" disabled={!isPremiumUser} onSelect={(e) => {if (!isPremiumUser) {e.preventDefault(); setSubscriptionModalOpen(true);}}}>
                                                        <span className="flex items-center justify-between w-full">
                                                            DOCX <Crown className="w-4 h-4 ml-2 text-yellow-500"/>
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="TXT" disabled={!isPremiumUser} onSelect={(e) => {if (!isPremiumUser) {e.preventDefault(); setSubscriptionModalOpen(true);}}}>
                                                        <span className="flex items-center justify-between w-full">
                                                            TXT <Crown className="w-4 h-4 ml-2 text-yellow-500"/>
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="qualityLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Gem /> {t('docgenQualityLabel')}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs" dangerouslySetInnerHTML={{ __html: t('docgenQualityTooltip') }} />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenQualityPlaceholder')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="medium">{t('docgenQualityMedium')}</SelectItem>
                                                    <SelectItem value="high">{t('docgenQualityHigh')}</SelectItem>
                                                    <SelectItem value="ultra" disabled={!isPremiumUser} onSelect={(e) => {if (!isPremiumUser) {e.preventDefault(); setSubscriptionModalOpen(true);}}}>
                                                         <span className="flex items-center justify-between w-full">
                                                            {t('docgenQualityUltra')} <Crown className="w-4 h-4 ml-2 text-yellow-500"/>
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="font"
                                        render={({ field }) => (
                                            <FormItem className={cn((isPresentation || isTimetable) && "hidden")}>
                                            <FormLabel className="flex items-center gap-2"><Type /> {t('docgenFontLabel')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isRichFormat}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenFontPlaceholder')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>{t('docgenFontStandard')}</SelectLabel>
                                                        {standardFonts.map(font => (
                                                            <SelectItem key={font.name} value={font.name} className={font.className}>
                                                                {font.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel>{t('docgenFontHandwriting')}</SelectLabel>
                                                        {handwritingFonts.map(font => (
                                                            <SelectItem key={font.name} value={font.name} className={font.className}>
                                                                {font.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <FormField
                                    control={form.control}
                                    name="theme"
                                    render={({ field }) => (
                                        <FormItem className={cn((isPresentation || isTimetable) && "hidden")}>
                                        <FormLabel className="flex items-center gap-2"><Palette /> {t('docgenThemeLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isRichFormat}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('docgenThemePlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="professional">{t('docgenThemeProfessional')}</SelectItem>
                                                <SelectItem value="creative">{t('docgenThemeCreative')}</SelectItem>
                                                <SelectItem value="minimalist">{t('docgenThemeMinimalist')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {t('docgenThemeDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="pageCount"
                                    render={({ field }) => (
                                        <FormItem className={cn(isTimetable && "hidden")}>
                                            <FormLabel className="flex items-center gap-2 cursor-pointer">
                                                <BookOpen /> {isPresentation ? t('docgenSlidesLabel') : t('docgenPagesLabel')}: {field.value}
                                            </FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={1}
                                                    max={30}
                                                    step={1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="numImages"
                                    render={({ field }) => (
                                        <FormItem className={cn(isTimetable && "hidden")}>
                                            <FormLabel className="flex items-center gap-2"><ImageIcon /> {t('docgenImagesLabel')}: {field.value}</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={isPremiumUser ? 15 : 10}
                                                    step={1}
                                                    value={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                    disabled={!isRichFormat || isGuest || isQuotaExceeded}
                                                />
                                            </FormControl>
                                            {isGuest ? (
                                                <FormDescription className="text-destructive">Sign in to generate images.</FormDescription>
                                            ) : isQuotaExceeded ? (
                                                <FormDescription className="text-destructive">Daily image quota exceeded. Try again tomorrow or upgrade.</FormDescription>
                                            ) : (
                                                <FormDescription>
                                                    {t('docgenImagesDescription')} {!isPremiumUser && `(${remainingImages} remaining today)`}
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {isPresentation && (
                                    <FormField
                                        control={form.control}
                                        name="generateTemplate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>{t('docgenTemplateLabel')}</FormLabel>
                                                    <FormDescription>
                                                        {t('docgenTemplateDescription')}
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isGuest || isQuotaExceeded}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                )}
                                
                                { isGuest && (
                                    <Alert variant="destructive">
                                        <Crown className="h-4 w-4" />
                                        <AlertTitle>Guest Mode Limitation</AlertTitle>
                                        <AlertDescription>
                                          Image generation is disabled for guest users. Please sign up for a free account to use this feature.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                <div
                                    className={cn("glowing-border", isLoading && "[--animation-play-state:paused]")}
                                >
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative w-full h-12 flex items-center justify-center bg-primary rounded-md text-primary-foreground font-bold text-lg disabled:opacity-100 disabled:bg-primary/80"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Wand2 className="h-5 w-5" strokeWidth={2.5} />
                                            {isLoading ? t('docgenGeneratingButton') : t('docgenGenerateButton', { type: isPresentation ? t('docgenDocTypePresentation') : isTimetable ? t('docgenDocTypeTimetable') : t('docgenDocTypeDocument') })}
                                            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </Form>
                        </fieldset>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col bg-muted/30">
                    <CardHeader>
                        <CardTitle>{t('docgenResultTitle')}</CardTitle>
                        <CardDescription>{t('docgenResultDescriptionEmpty')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 min-h-0 items-center justify-center">
                        {(isLoading || (progress > 0 && !result)) && (
                            <div className="w-full max-w-md text-center">
                                <PrintingAnimation />
                                <Progress value={progress} className="mt-4 w-full" />
                                <p className="mt-2 text-sm text-muted-foreground animate-pulse">
                                    {progressLabel}
                                </p>
                            </div>
                        )}
                        {result && !isLoading &&(
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-float-glow">
                                    {result.isPresentation ? <MonitorPlay className="w-12 h-12 text-primary icon-glow" /> : <Sparkles className="w-12 h-12 text-primary icon-glow" />}
                                </div>
                                <h3 className="mt-4 text-lg font-medium">{result.isPresentation ? t('docgenResultReadyPresentation') : t('docgenResultReadyDocument')}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{t('docgenResultReadyDescription')}</p>
                                <div className="flex gap-2 justify-center mt-6">
                                    <Button onClick={() => setViewerOpen(true)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('docgenViewButton', { type: result.isPresentation ? t('docgenDocTypePresentation') : t('docgenDocTypeDocument') })}
                                    </Button>
                                    <Button onClick={handleSaveToGoogleDrive} disabled={isUploading} variant="secondary">
                                        <CloudUpload className="mr-2 h-4 w-4" />
                                        {isUploading ? t('docgenSavingButton') : "Save to Google Drive"}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {!isLoading && !result && (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <p>{t('docgenResultPlaceholder')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {result && (
                    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                        <div className="dialog-content-parent">
                            <DialogContent className="max-w-none w-[95vw] sm:w-[90vw] md:w-[80vw] h-[90vh] flex flex-col p-0">
                                <DialogHeader className="p-4 border-b">
                                    <DialogTitle>{result.isPresentation ? t('docgenDocTypePresentation') : t('docgenDocTypeDocument')} {t('docgenViewerTitle')}</DialogTitle>
                                    <DialogDescription>
                                        {t('docgenViewerDescription')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="w-full h-full flex flex-col bg-muted/50 flex-1 min-h-0">
                                    <div className="flex items-center justify-end gap-2 p-2 border-b bg-background rounded-t-lg">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={handleDownload}>
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('docgenDownloadTooltip', { format: formValues.format || 'PDF' })}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('docgenCopyTooltip')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={handlePrint}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('docgenPrintTooltip')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <DialogClose asChild>
                                            <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setViewerOpen(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </DialogClose>
                                    </div>
                                    <ScrollArea className="flex-1 bg-muted/20" id="printable-area-wrapper">
                                    <div id="printable-area" className={cn("flex items-center justify-center p-4 sm:p-8", result.isPresentation ? "" : "flex-col gap-8")}>
                                    {result.isPresentation ? (
                                        <Carousel className="w-full max-w-4xl">
                                            <CarouselContent>
                                                {pages.map((page, index) => (
                                                    <CarouselItem key={index}>
                                                        <div className="p-1">
                                                            <Card 
                                                                id={`page-${index}`}
                                                                className="aspect-video flex items-center justify-center relative overflow-hidden text-white p-8 document-page"
                                                                style={{
                                                                    backgroundColor: result.theme.backgroundColor,
                                                                    borderImageSource: result.theme.backgroundImageDataUri ? `url(${result.theme.backgroundImageDataUri})` : 'none',
                                                                    borderImageSlice: 20,
                                                                    borderImageWidth: '20px',
                                                                    borderImageRepeat: 'repeat',
                                                                    borderStyle: 'solid',
                                                                    borderColor: 'transparent',
                                                                } as React.CSSProperties}
                                                            >
                                                                <div 
                                                                    className="relative z-10 w-full h-full flex flex-col justify-center text-center prose-invert prose-sm sm:prose-base md:prose-lg prose-h1:text-5xl prose-h2:text-4xl prose-img:max-h-60 prose-img:mx-auto prose-img:rounded-lg"
                                                                    style={{
                                                                        '--tw-prose-body': result.theme.textColor,
                                                                        '--tw-prose-headings': result.theme.headingColor,
                                                                    } as React.CSSProperties}
                                                                    dangerouslySetInnerHTML={{ __html: page.content }} 
                                                                />
                                                            </Card>
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="text-white bg-black/50 hover:bg-black/80 -left-8" />
                                            <CarouselNext className="text-white bg-black/50 hover:bg-black/80 -right-8" />
                                        </Carousel>
                                    ) : (
                                        <>
                                        {pages.map((page, index) => (
                                            <div 
                                                key={index} 
                                                id={`page-${index}`}
                                                className={cn(
                                                    "w-full max-w-4xl shadow-lg relative bg-white print:shadow-none print:border document-page",
                                                    pageSizeClasses[formValues.pageSize as keyof typeof pageSizeClasses]
                                                )}
                                                style={{
                                                    padding: '2rem 2.5rem',
                                                    backgroundColor: result.theme.backgroundColor,
                                                    color: result.theme.textColor,
                                                    borderImageSource: result.theme.backgroundImageDataUri ? `url(${result.theme.backgroundImageDataUri})` : 'none',
                                                    borderImageSlice: 20,
                                                    borderImageWidth: '20px',
                                                    borderImageRepeat: 'repeat',
                                                    borderStyle: 'solid',
                                                    borderColor: 'transparent',
                                                } as React.CSSProperties}
                                            >
                                                <div className={cn(
                                                    "relative z-10 whitespace-pre-wrap prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-table:w-full",
                                                    fontClasses[formValues.font as keyof typeof fontClasses]
                                                )}
                                                style={{
                                                    '--tw-prose-body': result.theme.textColor,
                                                    '--tw-prose-headings': result.theme.headingColor,
                                                    '--tw-prose-lead': result.theme.textColor,
                                                    '--tw-prose-links': result.theme.textColor,
                                                    '--tw-prose-bold': result.theme.textColor,
                                                    '--tw-prose-counters': result.theme.textColor,
                                                    '--tw-prose-bullets': result.theme.textColor,
                                                    '--tw-prose-hr': result.theme.textColor,
                                                    '--tw-prose-quotes': result.theme.textColor,
                                                    '--tw-prose-quote-borders': result.theme.textColor,
                                                    '--tw-prose-captions': result.theme.textColor,
                                                    '--tw-prose-code': result.theme.textColor,
                                                    '--tw-prose-pre-code': result.theme.textColor,
                                                    '--tw-prose-pre-bg': 'rgba(0,0,0,0.05)',
                                                    '--tw-prose-th-borders': result.theme.headingColor,
                                                    '--tw-prose-td-borders': result.theme.textColor,
                                                    '--tw-prose-invert-body': result.theme.textColor,
                                                    '--tw-prose-invert-headings': result.theme.headingColor,
                                                } as React.CSSProperties}
                                                dangerouslySetInnerHTML={{ __html: page.content }} 
                                                >
                                                </div>
                                            </div>
                                        ))}
                                        </>
                                    )}
                                    </div>
                                    </ScrollArea>
                                </div>
                            </DialogContent>
                        </div>
                    </Dialog>
                )}
            </div>
            
        </div>
    );
}
