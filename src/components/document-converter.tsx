'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, FileUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { convertDocument } from '@/ai/flows/convert-document';

const FormSchema = z.object({
  file: z.any().refine((files) => files?.length > 0, 'File is required.'),
  outputFormat: z.string().min(1, { message: 'Please select an output format.' }),
});

export function DocumentConverter() {
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const fileRef = form.register('file');

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsConverting(true);
    setResultUrl(null);
    setResultFileName(null);

    try {
      const file = data.file[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const fileDataUri = reader.result as string;
        const response = await convertDocument({
          fileDataUri,
          sourceFileName: file.name,
          targetFormat: data.outputFormat,
        });

        if (response.convertedFileDataUri) {
          setResultUrl(response.convertedFileDataUri);
          setResultFileName(response.convertedFileName);
          toast({
            title: 'Conversion Successful',
            description: `Your file has been converted to ${data.outputFormat}.`,
          });
        } else {
          throw new Error('Conversion failed to return a file.');
        }
        setIsConverting(false);
      };
      reader.onerror = () => {
        setIsConverting(false);
        toast({ variant: 'destructive', title: 'Error reading file' });
      };
    } catch (error) {
      setIsConverting(false);
      toast({ variant: 'destructive', title: 'Conversion Failed' });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Document Converter</CardTitle>
          <CardDescription>Convert your documents to various formats easily.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Upload Document</FormLabel>
                    <FormControl>
                      <Input {...fileRef} type="file" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outputFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convert To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an output format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="docx">DOCX</SelectItem>
                        <SelectItem value="txt">TXT</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isConverting} className="w-full">
                {isConverting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Converting...</>
                ) : (
                  <>Convert Document</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {resultUrl && (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Conversion Complete</CardTitle>
                <CardDescription>Your file is ready for download.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
                <a href={resultUrl} download={resultFileName || 'converted-file'}>
                    <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download {resultFileName}
                    </Button>
                </a>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
