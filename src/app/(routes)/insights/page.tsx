'use client';

import { Navigation } from '@/components/navigation';
import { ClimateTrends } from './components/climate-trends';
import { RiskAnalytics } from './components/risk-analytics';
import { DistrictComparison } from './components/district-comparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Climate Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of climate patterns and risk trends across Rwanda
          </p>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Climate Trends</TabsTrigger>
            <TabsTrigger value="analytics">Risk Analytics</TabsTrigger>
            <TabsTrigger value="comparison">District Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="mt-6">
            <ClimateTrends />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <RiskAnalytics />
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-6">
            <DistrictComparison />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
