import Link from 'next/link';
import { ArrowRight, Map, BarChart3, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Climate Risk Prediction for{' '}
              <span className="text-primary">Rwanda</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              I-si (Earth) leverages NASA POWER, CHIRPS, and Sentinel Hub data to predict and visualize 
              drought, flood, and vegetation stress risks across Rwanda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/map">
                  Explore Climate Risks
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/insights">
                  View Insights
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-time Climate Intelligence
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced satellite data analysis for informed decision-making
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Map className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Interactive Maps</CardTitle>
                <CardDescription>
                  Multi-layered geospatial visualization with real-time data
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Risk Analytics</CardTitle>
                <CardDescription>
                  Comprehensive climate risk assessment and trend analysis
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Early Warning</CardTitle>
                <CardDescription>
                  Proactive alerts for drought, flood, and vegetation stress
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Satellite Data</CardTitle>
                <CardDescription>
                  NASA POWER, CHIRPS, and Sentinel Hub integration
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powered by Leading Data Sources
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive climate data from trusted scientific institutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>NASA POWER</CardTitle>
                <CardDescription>
                  Precipitation, temperature, and solar radiation data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  High-resolution meteorological data for climate analysis and modeling.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>CHIRPS</CardTitle>
                <CardDescription>
                  Climate Hazards Group InfraRed Precipitation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Satellite-based precipitation estimates for drought monitoring.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sentinel Hub</CardTitle>
                <CardDescription>
                  NDVI and vegetation health monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earth observation data for vegetation stress and health assessment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore Climate Risks?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Start exploring interactive maps and insights to understand climate patterns in Rwanda.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/map">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
