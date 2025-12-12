
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Type } from "lucide-react";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const fontNameEnum = z.enum(['Caveat', 'Dancing Script', 'Patrick Hand', 'Indie Flower', 'Kalam', 'Reenie Beanie', 'Rock Salt']);

const formSchema = z.object({
  fontName: fontNameEnum.default('Patrick Hand'),
});

type FormSchemaType = z.infer<typeof formSchema>;

// This function generates the HTML content for the PDF export.
function generateHtmlForPdf(text: string, fontName: string): string {
    const renderedText = text.replace(/\n/g, '<br/>');
    
    // A realistic, grainy, single-lined white paper background.
    const realisticPaperBackground = `
        background-color: #ffffff;
        background-image: 
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cfilter id='grain' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Cpattern id='p' width='100' height='26' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 25.5h100' stroke='%23e0e0e0' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.07'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E");
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Indie+Flower&family=Kalam&family=Patrick+Hand&family=Reenie+Beanie&family=Rock+Salt&display=swap');
                body {
                    margin: 0;
                    padding: 0;
                    width: 210mm;
                    min-height: 297mm;
                    box-sizing: border-box;
                    ${realisticPaperBackground}
                    font-family: '${fontName}', cursive;
                    font-size: 16px;
                    color: #00005a;
                    line-height: 26px;
                    padding: 20mm;
                }
                .content {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    padding-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="content">${renderedText}</div>
        </body>
        </html>
    `;
}

export function HandwritingConverter() {
    const { toast } = useToast();
    const [sourceText, setSourceText] = useState('');

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fontName: 'Patrick Hand',
        },
    });

    const fontName = form.watch('fontName');
    
    const pageStyle = {
        fontFamily: `'${fontName}', cursive`,
        color: '#00005a', // Dark blue "ink" color
        backgroundColor: '#ffffff',
        // White, grainy, single-lined paper effect
        backgroundImage: `
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cfilter id='grain' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Cpattern id='p' width='100' height='26' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 25.5h100' stroke='%23e0e0e0' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.07'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E")
        `,
    };

    const handleDownload = () => {
        if (!sourceText) {
            toast({ variant: 'destructive', title: 'Nothing to Download', description: 'Please enter some text first.'});
            return;
        };
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const htmlContent = generateHtmlForPdf(sourceText, fontName);

        pdf.html(htmlContent, {
            callback: function (pdf) {
                pdf.save("handwritten-note.pdf");
                toast({ title: 'Download Started', description: 'Your note is being downloaded as a PDF.' });
            },
            x: 0,
            y: 0,
            width: 210,
            windowWidth: 794 
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>AI Handwritten Notes Converter</CardTitle>
                    <CardDescription>
                        Type your text below, choose a style, and download a realistic handwritten PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                             <Form {...form}>
                                <form className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="fontName"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Type/> 1. Choose Handwriting Style</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Caveat">Casual (Caveat)</SelectItem>
                                                    <SelectItem value="Dancing Script">Elegant (Dancing Script)</SelectItem>
                                                    <SelectItem value="Patrick Hand">Neat (Patrick Hand)</SelectItem>
                                                    <SelectItem value="Indie Flower">Bubbly (Indie Flower)</SelectItem>
                                                    <SelectItem value="Kalam">Natural Slant (Kalam)</SelectItem>
                                                    <SelectItem value="Reenie Beanie">Scratchy (Reenie Beanie)</SelectItem>
                                                    <SelectItem value="Rock Salt">Bold Marker (Rock Salt)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormItem>
                                        <FormLabel>2. Write Your Text</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Type your notes here... a live preview will be shown on the right."
                                                className="h-96"
                                                value={sourceText}
                                                onChange={(e) => setSourceText(e.target.value)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                    <Button type="button" className="w-full" onClick={handleDownload} disabled={!sourceText}>
                                        <Download className="mr-2 h-4 w-4"/> Download PDF
                                    </Button>
                                </form>
                            </Form>
                        </div>
                        <div className="space-y-4">
                            <Label>Live Preview</Label>
                            <div 
                                className="w-full aspect-[8.5/11] rounded-lg shadow-lg overflow-auto p-8 text-lg"
                                style={pageStyle}
                            >
                                <pre className="whitespace-pre-wrap font-inherit leading-[26px]">
                                    {sourceText || "Your handwritten text will appear here..."}
                                </pre>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
