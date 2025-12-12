
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl shadow-destructive/10 border-destructive/20">
        <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          <CardTitle className="mt-4 text-2xl text-destructive">Oops! Something went wrong.</CardTitle>
          <CardDescription>
            We encountered an unexpected issue. Please try again or return to the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-left text-xs text-muted-foreground overflow-auto max-h-24">
                <p><strong>Error:</strong> {error.message}</p>
                {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
            </div>
            <div className="flex justify-center gap-4">
                 <Button onClick={() => reset()} variant="destructive">
                    Try again
                </Button>
                <Button variant="outline" asChild>
                    <a href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go to Homepage
                    </a>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
