'use client';

import { Navigation } from '@/components/navigation';
import { ClimateChat } from '@/components/climate-chat';

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Climate Intelligence Assistant</h1>
          <p className="text-muted-foreground">
            Ask questions about climate data, flood risks, and agricultural conditions in Rwanda.
            The AI can access real-time data from CHIRPS, NASA POWER, SRTM, and Sentinel Hub.
          </p>
        </div>

        <div className="h-[calc(100vh-16rem)]">
          <ClimateChat agent="climateAnalyst" />
        </div>
      </div>
    </div>
  );
}
