
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Layers, Wand2, FileUp, Loader2, Download, CloudUpload, FileX2, Image as ImageIcon, Type, MapPin, Eye, Trash2, RotateCcw, Cog, FileDown, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addWatermark, AddWatermarkInput, AddWatermarkOutput } from "@/ai/flows/add-watermark";
import { useSubscription } from "@/hooks/use-subscription";
import { premiumTools } from "@/config/subscriptions";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Crown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Box } from 'lucide-react';

const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB
const compressionLevels = ['none', 'low', 'medium', 'high', 'ultra', 'max'] as const;

const formSchema = z.object({
    pdfFile: z.any().refine(file => file instanceof File, "Please upload a PDF file."),
    watermarkType: z.enum(['text', 'image']).default('text'),
    watermarkText: z.string().optional(),
    watermarkImage: z.any().optional(),
    position: z.enum(['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center', 'diagonal']).default('center'),
    opacity: z.number().min(0).max(1).default(0.5),
    fontSize: z.number().min(8).max(144).default(50),
    angle: z.number().min(0).max(90).default(0),
    logoScale: z.number().min(1).max(100).default(25),
    enableCompression: z.boolean().default(false),
}).refine(data => {
    if (data.watermarkType === 'text') return !!data.watermarkText && data.watermarkText.length > 0;
    return true;
}, { message: "Watermark text cannot be empty.", path: ["watermarkText"] })
.refine(data => {
    if (data.watermarkType === 'image') return !!data.watermarkImage;
    return true;
}, { message: "Please upload a watermark image.", path: ["watermarkImage"] });


const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function WatermarkAdder({ setSubscriptionModalOpen }: { setSubscriptionModalOpen: (isOpen: boolean) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AddWatermarkOutput | null>(null);
    const { toast } = useToast();
    const { subscription } = useSubscription();
    
    const isPremium = premiumTools.includes('watermark-adder-compression'); // Fictional tool name for premium check
    const hasPremiumAccess = subscription.status === 'active' || subscription.status === 'trial';

    const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
    const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            watermarkType: 'text',
            position: 'center',
            opacity: 0.5,
            fontSize: 50,
            angle: 0,
            logoScale: 25,
            watermarkText: '',
            enableCompression: false,
        },
    });
    
    const watermarkType = form.watch("watermarkType");
    const watermarkSettings = form.watch();

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a valid PDF file.' });
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload a PDF smaller than 80MB.' });
            return;
        }

        form.setValue('pdfFile', file);
        setFileName(file.name);
        if(originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
        setOriginalPdfUrl(URL.createObjectURL(file));
        setResult(null);
    };
    
    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
             toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a valid image file.' });
             return;
        }
        form.setValue('watermarkImage', file);
        if(watermarkImageUrl) URL.revokeObjectURL(watermarkImageUrl);
        setWatermarkImageUrl(URL.createObjectURL(file));
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.enableCompression) {
            toast({
                title: "Coming Soon!",
                description: "The PDF compression feature is currently under development and will be available soon.",
            });
        }
        
        setIsLoading(true);
        setResult(null);
        try {
            const pdfDataUri = await fileToDataUri(values.pdfFile);
            let watermarkImageDataUri: string | undefined;
            if (values.watermarkType === 'image' && values.watermarkImage) {
                watermarkImageDataUri = await fileToDataUri(values.watermarkImage);
            }

            const input: AddWatermarkInput = {
                pdfDataUri,
                watermarkType: values.watermarkType,
                watermarkText: values.watermarkText,
                watermarkImageDataUri,
                position: values.position,
                opacity: values.opacity,
                fontSize: values.fontSize,
                angle: values.angle,
                logoScale: values.logoScale / 100, // Convert percentage to 0-1 scale
                compressionLevel: 'none', // Hardcode to 'none' as feature is coming soon
            };
            
            const output = await addWatermark(input);
            setResult(output);
             toast({
                title: 'Watermark Added!',
                description: 'Your document has been successfully watermarked.',
            });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to add watermark. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }

    const clearForm = () => {
        form.reset({
            watermarkType: 'text',
            position: 'center',
            opacity: 0.5,
            fontSize: 50,
            angle: 0,
            logoScale: 25,
            watermarkText: '',
            enableCompression: false,
        });
        if(originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
        if(watermarkImageUrl) URL.revokeObjectURL(watermarkImageUrl);
        setOriginalPdfUrl(null);
        setWatermarkImageUrl(null);
        setFileName("");
        setResult(null);
    }
    
    const handleCompressionToggle = (checked: boolean) => {
        if (checked && !hasPremiumAccess) {
            setSubscriptionModalOpen(true);
            form.setValue('enableCompression', false); // Revert switch if user is not premium
            return;
        }
        if(checked && hasPremiumAccess) {
             toast({
                title: "Coming Soon!",
                description: "The PDF compression feature is currently under development.",
            });
        }
        form.setValue('enableCompression', checked);
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Watermark Adder</CardTitle>
                    <CardDescription>Easily add a text or image watermark to your PDF documents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                     <fieldset disabled={isLoading}>
                                        <FormField
                                            control={form.control}
                                            name="pdfFile"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>1. Upload Your PDF</FormLabel>
                                                    <FormControl>
                                                         <div className="flex items-center gap-4">
                                                            <Button asChild variant="outline" className="w-full">
                                                              <label htmlFor="pdf-upload" className="cursor-pointer flex items-center justify-center gap-2">
                                                                <FileUp /> {fileName || 'Choose PDF File'}
                                                              </label>
                                                            </Button>
                                                            <Input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                                            {fileName && <Button type="button" variant="ghost" size="icon" onClick={clearForm}><Trash2 className="text-destructive"/></Button>}
                                                         </div>
                                                    </FormControl>
                                                    <FormDescription>Max file size: 80MB.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        <FormField
                                            control={form.control}
                                            name="watermarkType"
                                            render={({ field }) => (
                                              <FormItem className="space-y-3">
                                                <FormLabel>2. Choose Watermark Type</FormLabel>
                                                <div className="flex items-center gap-2">
                                                  <Type />
                                                  <FormControl>
                                                      <Switch checked={field.value === 'image'} onCheckedChange={(checked) => field.onChange(checked ? 'image' : 'text')} />
                                                  </FormControl>
                                                  <ImageIcon />
                                                </div>
                                                <FormDescription>
                                                  Switch ON for an image/logo watermark, or OFF for a text watermark.
                                                </FormDescription>
                                              </FormItem>
                                            )}
                                          />
                                          
                                          {watermarkType === 'text' ? (
                                            <FormField
                                                control={form.control}
                                                name="watermarkText"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2"><Type/> Watermark Text</FormLabel>
                                                        <FormControl><Input placeholder="e.g., Confidential" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                          ) : (
                                            <FormField
                                                control={form.control}
                                                name="watermarkImage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2"><ImageIcon/> Upload Logo</FormLabel>
                                                        <FormControl>
                                                            <Input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                          )}
                                          
                                        <h3 className="text-sm font-medium">3. Configure Settings</h3>
                                        
                                         <FormField
                                            control={form.control}
                                            name="position"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2"><MapPin/> Position</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="center">Center</SelectItem>
                                                            <SelectItem value="diagonal">Diagonal (Text only)</SelectItem>
                                                            <SelectItem value="topLeft">Top Left</SelectItem>
                                                            <SelectItem value="topRight">Top Right</SelectItem>
                                                            <SelectItem value="bottomLeft">Bottom Left</SelectItem>
                                                            <SelectItem value="bottomRight">Bottom Right</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                         <FormField
                                            control={form.control}
                                            name="opacity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Opacity: {Math.round(field.value * 100)}%</FormLabel>
                                                    <FormControl>
                                                        <Slider min={0} max={1} step={0.05} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                         <FormField
                                            control={form.control}
                                            name="angle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2"><RotateCcw /> Rotation: {field.value}°</FormLabel>
                                                    <FormControl>
                                                        <Slider min={0} max={90} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        
                                        {watermarkType === 'text' && (
                                             <FormField
                                                control={form.control}
                                                name="fontSize"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Font Size: {field.value}pt</FormLabel>
                                                        <FormControl>
                                                            <Slider min={8} max={144} step={1} value={[field.value || 50]} onValueChange={(v) => field.onChange(v[0])} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {watermarkType === 'image' && (
                                             <FormField
                                                control={form.control}
                                                name="logoScale"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Logo Size: {field.value}%</FormLabel>
                                                        <FormControl>
                                                            <Slider min={1} max={100} step={1} value={[field.value || 25]} onValueChange={(v) => field.onChange(v[0])} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        
                                        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" className="w-full flex justify-between px-0 -mb-2 hover:bg-transparent">
                                                    <span className="flex items-center gap-2 font-semibold">
                                                        <Cog className="h-4 w-4" />
                                                        Advanced Settings
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="space-y-6 pt-4 border-t mt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="enableCompression"
                                                    render={({ field }) => (
                                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="flex items-center gap-2">
                                                                Enable PDF Compression 
                                                                <Crown className="h-4 w-4 text-yellow-500"/>
                                                            </FormLabel>
                                                            <FormDescription>
                                                                Reduce the final file size. (Premium)
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                          <Switch
                                                            checked={field.value}
                                                            onCheckedChange={handleCompressionToggle}
                                                          />
                                                        </FormControl>
                                                      </FormItem>
                                                    )}
                                                  />
                                            </CollapsibleContent>
                                        </Collapsible>
                                        
                                        <Button type="submit" className="w-full mt-8" disabled={!fileName || isLoading}>
                                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Applying Watermark...</> : <><Wand2 className="mr-2 h-4 w-4" /> Add Watermark</>}
                                        </Button>
                                    </fieldset>
                                </div>
                                <div className="space-y-4">
                                     <Card>
                                        <CardHeader className="p-4">
                                          <CardTitle className="text-lg flex items-center gap-2"><Eye/> Live Preview</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-2">
                                            <div className="aspect-[8.5/11] w-full bg-white rounded-md flex items-center justify-center relative overflow-hidden border">
                                                { (watermarkSettings.watermarkType === 'text' && watermarkSettings.watermarkText) || (watermarkSettings.watermarkType === 'image' && watermarkImageUrl) ?
                                                    (<div 
                                                        className="absolute flex items-center justify-center"
                                                        style={{
                                                            inset: 0,
                                                            justifyContent: watermarkSettings.position.includes('Right') ? 'flex-end' : watermarkSettings.position.includes('Left') ? 'flex-start' : 'center',
                                                            alignItems: watermarkSettings.position.includes('top') ? 'flex-start' : watermarkSettings.position.includes('bottom') ? 'flex-end' : 'center',
                                                            padding: '20px',
                                                        }}
                                                    >
                                                        {watermarkSettings.watermarkType === 'text' ? (
                                                            <p
                                                                style={{
                                                                    fontSize: `${watermarkSettings.fontSize * 0.5}px`, // Scale down for preview
                                                                    opacity: watermarkSettings.opacity,
                                                                    transform: `rotate(${watermarkSettings.position === 'diagonal' ? -45 : watermarkSettings.angle}deg)`,
                                                                    color: '#808080',
                                                                    fontWeight: 'bold',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {watermarkSettings.watermarkText}
                                                            </p>
                                                        ) : (
                                                            watermarkImageUrl && <img
                                                                src={watermarkImageUrl}
                                                                alt="Watermark Preview"
                                                                style={{
                                                                    width: `${watermarkSettings.logoScale}%`,
                                                                    opacity: watermarkSettings.opacity,
                                                                    transform: `rotate(${watermarkSettings.angle}deg)`,
                                                                }}
                                                             />
                                                        )}
                                                    </div>)
                                                :
                                                (<div className="text-center text-muted-foreground p-4">
                                                    <Box className="mx-auto h-10 w-10 mb-2"/>
                                                    <p>Your watermark preview will appear here</p>
                                                 </div>)
                                                }
                                            </div>
                                        </CardContent>
                                      </Card>
                                      {result && !isLoading && (
                                        <Card>
                                            <CardHeader className="p-4">
                                                <CardTitle className="text-lg flex items-center gap-2">Result</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-4">
                                                 <Alert>
                                                    <ArrowRight className="h-4 w-4" />
                                                    <AlertTitle>Processing Complete!</AlertTitle>
                                                    <AlertDescription>
                                                        Your watermarked PDF is ready. Download it below.
                                                    </AlertDescription>
                                                </Alert>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button asChild className="w-full">
                                                        <a href={result.cleanedPdfDataUri} download={`watermarked_${fileName}`}>
                                                            <FileDown className="mr-2 h-4 w-4" /> Download Watermarked
                                                        </a>
                                                    </Button>
                                                     {originalPdfUrl && (<Button asChild variant="secondary" className="w-full">
                                                        <a href={originalPdfUrl} download={fileName}>
                                                            <Download className="mr-2 h-4 w-4" /> Download Original
                                                        </a>
                                                    </Button>)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                      )}
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
