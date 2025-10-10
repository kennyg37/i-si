import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

function UnsubscribeSuccessContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Unsubscribed Successfully</CardTitle>
          <CardDescription>
            You&apos;ve been removed from our weather alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re sorry to see you go! You won&apos;t receive any more weather alert emails from us.
          </p>
          <p className="text-sm text-muted-foreground">
            You can always resubscribe at any time if you change your mind.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <UnsubscribeSuccessContent />
    </Suspense>
  );
}
