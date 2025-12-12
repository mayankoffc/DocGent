
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, FileX2 } from "lucide-react";

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
import { analyzeDocument, AnalyzeDocumentInput, AnalyzeDocumentOutput } from "@/ai/flows/analyze-document";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { useRecentGenerations } from "@/hooks/use-recent-generations";


const formSchema = z.object({
  documentContent: z.string().min(50, {
    message: "Document content must be at least 50 characters.",
  }),
  userQuestion: z.string().min(5, {
    message: "Question must be at least 5 characters.",
  }),
});

export function DocumentAnalyzer() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { getToolState, setToolState } = useToolState<AnalyzeDocumentOutput>('analyzer');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();
    const { t } = useTranslation();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            documentContent: "",
            userQuestion: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setToolState(null);
        try {
            const output = await analyzeDocument(values as AnalyzeDocumentInput);
            setToolState(output);
            addRecentGeneration({
                type: 'analyzer',
                title: `Analysis of: ${values.userQuestion}`,
                data: output,
                formValues: values,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('toastAnalyzerError'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (result && !isLoading) {
        return (
            <div className="space-y-4">
                 
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('analyzerResultTitle')}</CardTitle>
                        <CardDescription>{t('analyzerResultDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        
                        <Accordion type="single" collapsible defaultValue="summary" className="w-full">
                            <AccordionItem value="summary">
                                <AccordionTrigger className="font-headline">{t('analyzerSummary')}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="whitespace-pre-wrap">{result.summary}</p>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="answer">
                                <AccordionTrigger className="font-headline">{t('analyzerAnswer')}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="whitespace-pre-wrap">{result.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
                <Button onClick={() => setToolState(null)} variant="outline" className="w-full">
                    <FileX2 className="mr-2 h-4 w-4" />
                    {t('analyzerAnotherButton')}
                </Button>
                
            </div>
        )
    }

    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('analyzerToolName')}</CardTitle>
                        <CardDescription>
                            {t('analyzerToolDescriptionLong')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="documentContent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('analyzerContentLabel')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('analyzerContentPlaceholder')}
                                                    className="min-h-[200px]"
                                                    {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('analyzerContentDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="userQuestion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('analyzerQuestionLabel')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('analyzerQuestionPlaceholder')} {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                {t('analyzerQuestionDescription')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? t('analyzerAnalyzingButton') : t('analyzerAnalyzeButton')}
                                    <Sparkles className="ml-2 w-4 h-4" />
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px]">
                    <CardHeader>
                        <CardTitle>{t('analyzerResultTitle')}</CardTitle>
                        <CardDescription>{t('analyzerResultDescriptionEmpty')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                            <div className="space-y-6">
                                <div>
                                    <Skeleton className="h-5 w-1/3 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full mt-2" />
                                </div>
                                <div>
                                    <Skeleton className="h-5 w-1/3 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3 mt-2" />
                                </div>
                            </div>
                        )}
                        {!result && !isLoading && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                {t('analyzerResultPlaceholder')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}
