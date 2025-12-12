
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX, Home } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
         <div className="absolute top-8 left-8 flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold font-headline">DOC AI</span>
        </div>
      <Card className="w-full max-w-lg text-center shadow-2xl shadow-primary/10">
        <CardHeader>
             <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <SearchX className="w-8 h-8 text-primary" />
            </div>
          <CardTitle className="mt-4 text-4xl font-bold tracking-tight">404 - Page Not Found</CardTitle>
          <CardDescription className="text-lg">
            Sorry, the page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go back to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
