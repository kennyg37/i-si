import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Database, Users, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">About I-si</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Climate risk prediction and visualization platform for Rwanda, 
              powered by cutting-edge satellite data and scientific research.
            </p>
          </div>

          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
              I-si (meaning &quot;Earth&quot; in Kinyarwanda) is dedicated to providing accurate, 
              real-time climate risk assessments for Rwanda. Our platform combines 
              multiple satellite data sources to predict and visualize drought, flood, 
              and vegetation stress risks across the country.
              </p>
              <p className="text-muted-foreground">
                By leveraging NASA POWER, CHIRPS, and Sentinel Hub data, we enable 
                informed decision-making for farmers, policymakers, and researchers 
                working to build climate resilience in Rwanda.
              </p>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Sources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">NASA POWER</h3>
                  <p className="text-sm text-muted-foreground">
                    High-resolution meteorological data including precipitation, 
                    temperature, and solar radiation from NASA&apos;s Prediction of 
                    Worldwide Energy Resources (POWER) project.
                  </p>
                  <Badge variant="outline">Meteorological</Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">CHIRPS</h3>
                  <p className="text-sm text-muted-foreground">
                    Climate Hazards Group InfraRed Precipitation with Station data 
                    provides high-resolution precipitation estimates for drought 
                    monitoring and agricultural applications.
                  </p>
                  <Badge variant="outline">Precipitation</Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Sentinel Hub</h3>
                  <p className="text-sm text-muted-foreground">
                    Earth observation data from Sentinel-2 satellites providing 
                    NDVI (Normalized Difference Vegetation Index) for vegetation 
                    health monitoring and stress detection.
                  </p>
                  <Badge variant="outline">Vegetation</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Frontend</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Next.js 14</Badge>
                    <Badge>React 18</Badge>
                    <Badge>TypeScript</Badge>
                    <Badge>Tailwind CSS</Badge>
                    <Badge>shadcn/ui</Badge>
                    <Badge>Framer Motion</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Maps & Visualization</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Mapbox GL JS</Badge>
                    <Badge>react-map-gl</Badge>
                    <Badge>Turf.js</Badge>
                    <Badge>Plotly.js</Badge>
                    <Badge>Recharts</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Data & State</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>TanStack Query</Badge>
                    <Badge>Axios</Badge>
                    <Badge>Zustand</Badge>
                    <Badge>React Hook Form</Badge>
                    <Badge>Zod</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">Deployment</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Vercel</Badge>
                    <Badge>Serverless</Badge>
                    <Badge>Edge Functions</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Development Team</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                I-si is developed by a team of climate scientists, data engineers, 
                and software developers committed to advancing climate resilience 
                in Rwanda through technology.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Climate Science</h3>
                  <p className="text-sm text-muted-foreground">
                    Expert analysis of satellite data and climate patterns to 
                    ensure accurate risk assessments and predictions.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Software Engineering</h3>
                  <p className="text-sm text-muted-foreground">
                    Modern web technologies and best practices to deliver 
                    a fast, reliable, and user-friendly platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Documentation & Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive documentation for integrating with our climate 
                    data APIs and accessing real-time risk assessments.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Methodology</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed explanation of our risk calculation algorithms, 
                    data processing methods, and validation procedures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For questions, feedback, or collaboration opportunities, 
                please reach out to our team. We&apos;re committed to continuous 
                improvement and welcome input from users and stakeholders.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2024 I-si Climate Risk Platform. Built with ❤️ for Rwanda&apos;s climate resilience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
