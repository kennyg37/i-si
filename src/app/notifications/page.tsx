'use client';

import { NotifyMe } from '@/components/notify-me';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, Mail, MapPin, Settings, Zap } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Weather Alert Notifications
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay informed about extreme weather events in your area. Get real-time alerts delivered straight to your inbox.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Real-Time Alerts</CardTitle>
              <CardDescription>
                Receive instant notifications when extreme weather conditions are detected in your area
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-green-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Location-Based</CardTitle>
              <CardDescription>
                Choose your exact location on the map or use GPS to get alerts specific to your area
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Customizable</CardTitle>
              <CardDescription>
                Control which events you want to be notified about and how often you receive alerts
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Subscription Form */}
        <div className="mb-12">
          <NotifyMe />
        </div>

        {/* What You Get Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>What You&apos;ll Receive</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Alert Types</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Heat Waves</strong>
                      <p className="text-sm text-muted-foreground">Extended periods of excessive heat</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Floods & Heavy Rain</strong>
                      <p className="text-sm text-muted-foreground">Precipitation events and flood risks</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Droughts</strong>
                      <p className="text-sm text-muted-foreground">Low precipitation and water stress</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Storms & High Winds</strong>
                      <p className="text-sm text-muted-foreground">Severe weather and wind events</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Alert Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Severity Ratings</strong>
                      <p className="text-sm text-muted-foreground">Low, moderate, high, and extreme classifications</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Actionable Recommendations</strong>
                      <p className="text-sm text-muted-foreground">Practical safety tips and precautions</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Event Duration</strong>
                      <p className="text-sm text-muted-foreground">Start and end dates for planning</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Real-Time Data</strong>
                      <p className="text-sm text-muted-foreground">Powered by Open-Meteo weather data</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Your privacy is important to us. We&apos;ll only send you weather alerts and you can unsubscribe at any time.
          </p>
          <p>
            Need help? Check our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              documentation
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:underline">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
