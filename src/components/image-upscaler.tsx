
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wand2, Loader2, Download, CloudUpload, FileUp, Crown, Trash2, Contrast, Droplets } from "lucide-react";
import Image from "next/image";
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';


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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { upscaleImage, UpscaleImageInput, UpscaleImageOutput } from "@/ai/flows/upscale-image";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { PixelPerfectAnimation } from "./pixel-perfect-animation";


const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const resolutionSchema = z.enum(['1K', '2K', '4K', '6K', '8K']);
export type ResolutionValue = z.infer<typeof resolutionSchema>;

const formSchema = z.object({
  imageFile: z.any().refine(file => file instanceof File, "Please upload an image file."),
  resolution: resolutionSchema.default('2K'),
  applyHdrEffect: z.boolean().default(false),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface ImageUpscalerProps {
    setSubscriptionModalOpen: (isOpen: boolean) => void;
}

export function ImageUpscaler({ setSubscriptionModalOpen }: ImageUpscalerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<UpscaleImageOutput | null>(null);
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
    const [sourceImageDimensions, setSourceImageDimensions] = useState<{width: number; height: number} | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const { subscription, refreshSubscription } = useSubscription();
    const isPremiumUser = subscription.status === 'active' || subscription.status === 'trial';
    const isGuest = !user;
    const isQuotaExceeded = !isPremiumUser && subscription.imageGenerationCount >= 10;

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            resolution: "2K",
            applyHdrEffect: false,
        },
    });

    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid image file.' });
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload an image smaller than 25MB.' });
            return;
        }

        form.setValue('imageFile', file);
        if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
        
        const url = URL.createObjectURL(file);
        setSourceImageUrl(url);
        
        // Get image dimensions
        const img = document.createElement('img');
        img.onload = () => {
            setSourceImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = url;

        setResult(null); // Clear previous results
        toast({ title: "Image Ready", description: `${file.name} is ready for upscaling.`});
    };
    
    const clearForm = () => {
        form.reset();
        if(sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
        setSourceImageUrl(null);
        setSourceImageDimensions(null);
        setResult(null);
    }

    async function onSubmit(values: FormSchemaType) {
        if (isQuotaExceeded || isGuest) {
            toast({ variant: 'destructive', title: 'Feature Unavailable', description: isGuest ? 'Please sign in to use the upscaler.' : 'Your daily image processing limit has been reached.' });
            return;
        }
        
        const isPremiumResolution = ['4K', '6K', '8K'].includes(values.resolution);
        if (isPremiumResolution && !isPremiumUser) {
            setSubscriptionModalOpen(true);
            return;
        }

        setIsLoading(true);
        setResult(null);
        try {
            const imageDataUri = await fileToDataUri(values.imageFile);
            const input: UpscaleImageInput = {
                imageDataUri,
                resolution: values.resolution,
                applyHdrEffect: values.applyHdrEffect,
                userId: user?.uid,
                subscription: subscription,
            };
            const output = await upscaleImage(input);
            setResult(output);
            await refreshSubscription(); // Refresh to update image count
            toast({ title: 'Upscaling Complete!', description: `Your image has been successfully upscaled to ${values.resolution}.` });
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Upscaling Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const resolutionOptions: {value: ResolutionValue; label: string; premium: boolean}[] = [
        { value: '1K', label: '1K (Standard)', premium: false },
        { value: '2K', label: 'HD', premium: false },
        { value: '4K', label: 'Ultra HD', premium: true },
        { value: '6K', label: 'Super-Res', premium: true },
        { value: '8K', label: 'Max-Res', premium: true },
    ];

    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>AI Image Upscaler</CardTitle>
                        <CardDescription>
                           Enhance your images to stunning high resolutions using advanced AI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <fieldset disabled={isLoading}>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="imageFile"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>1. Upload Your Image</FormLabel>
                                                <div className="relative flex items-center justify-center w-full">
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
                                                    >
                                                        {sourceImageUrl ? (
                                                            <div className="relative w-full h-full">
                                                                <Image src={sourceImageUrl} alt="Source Preview" layout="fill" objectFit="contain" className="rounded-md" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 25MB)</p>
                                                            </div>
                                                        )}
                                                         <FormControl>
                                                            <Input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                                         </FormControl>
                                                    </label>
                                                     {sourceImageUrl && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={clearForm}><Trash2/></Button>}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name="resolution"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>2. Select Target Resolution</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={field.onChange}
                                              defaultValue={field.value}
                                              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"
                                            >
                                                {resolutionOptions.map(option => (
                                                  <FormItem key={option.value}>
                                                    <FormControl>
                                                      <RadioGroupItem value={option.value} id={option.value} className="sr-only peer" disabled={option.premium && !isPremiumUser} />
                                                    </FormControl>
                                                    <Label
                                                      htmlFor={option.value}
                                                      className={cn(
                                                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 text-center h-20 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                                        (option.premium && !isPremiumUser) && "opacity-50 cursor-not-allowed"
                                                      )}
                                                      onClick={() => option.premium && !isPremiumUser && setSubscriptionModalOpen(true)}
                                                    >
                                                        <span className="font-bold text-base">{option.value}</span>
                                                        <span className="text-xs text-muted-foreground">{option.label}</span>
                                                         {option.premium && <Crown className="w-3 h-3 text-yellow-400 mt-1" />}
                                                    </Label>
                                                  </FormItem>
                                                ))}
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                        control={form.control}
                                        name="applyHdrEffect"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="flex items-center gap-2"><Droplets/> Apply HDR10+ Effect</FormLabel>
                                                    <FormDescription>
                                                        Enhance colors and contrast for a vibrant look.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                     { (isGuest || isQuotaExceeded) && (
                                        <Alert variant="destructive">
                                            <Crown className="h-4 w-4" />
                                            <AlertTitle>{isGuest ? 'Guest Mode Limitation' : 'Daily Quota Exceeded'}</AlertTitle>
                                            <AlertDescription>
                                            {isGuest 
                                                ? 'Please sign up for a free account to use this feature.' 
                                                : 'You have used your daily limit of 10 free image operations. Please upgrade or try again tomorrow.'
                                            }
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button type="submit" disabled={isLoading || !sourceImageUrl || isGuest || isQuotaExceeded} className="w-full">
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        {isLoading ? "Upscaling with AI..." : "Upscale Image"}
                                    </Button>
                                </form>
                            </Form>
                        </fieldset>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Upscaled Result</CardTitle>
                        <CardDescription>Your enhanced image will appear here. Drag the slider to compare.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 min-h-0 items-center justify-center">
                         {isLoading && sourceImageDimensions && (
                            <PixelPerfectAnimation sourceDimensions={sourceImageDimensions} targetResolution={form.getValues('resolution')} />
                        )}
                        {!isLoading && result && sourceImageUrl && (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-full max-h-[500px] rounded-lg overflow-hidden shadow-lg border bg-muted">
                                     <ReactCompareSlider
                                        itemOne={<ReactCompareSliderImage src={sourceImageUrl} alt="Before" style={{ objectFit: 'contain' }} />}
                                        itemTwo={<ReactCompareSliderImage src={result.imageDataUri} alt="After" style={{ objectFit: 'contain' }}/>}
                                        className="w-full h-full"
                                     />
                                </div>
                                 <div className="flex gap-2 justify-center mt-2">
                                    <Button asChild>
                                        <a href={result.imageDataUri} download="upscaled-image.png">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Image
                                        </a>
                                    </Button>
                                    <Button disabled variant="secondary">
                                        <CloudUpload className="mr-2 h-4 w-4" />
                                        Save to Cloud
                                    </Button>
                                </div>
                            </div>
                        )}
                        {!isLoading && !result && (
                            <div className="w-full h-full flex items-center justify-center text-center text-muted-foreground p-8 rounded-md border-2 border-dashed bg-muted/50">
                                <p>Upload an image and choose a resolution to begin.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}
