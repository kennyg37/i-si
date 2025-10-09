'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, TrendingUp, CloudRain, AlertTriangle } from 'lucide-react';
import { ClimateChat } from './climate-chat';

interface QuickQuestion {
  question: string;
  icon: any;
  category: 'temperature' | 'rainfall' | 'risk' | 'trends';
}

const quickQuestions: QuickQuestion[] = [
  {
    question: "Explain the temperature trends and what they mean for Rwanda",
    icon: TrendingUp,
    category: 'temperature',
  },
  {
    question: "What does the rainfall pattern indicate for agriculture?",
    icon: CloudRain,
    category: 'rainfall',
  },
  {
    question: "How should I interpret the flood risk index?",
    icon: AlertTriangle,
    category: 'risk',
  },
  {
    question: "What's the drought risk level and its implications?",
    icon: AlertTriangle,
    category: 'risk',
  },
  {
    question: "Compare temperature anomalies across different regions",
    icon: TrendingUp,
    category: 'trends',
  },
  {
    question: "What actions should be taken based on current climate data?",
    icon: Sparkles,
    category: 'trends',
  },
];

interface InsightsAIHelperProps {
  stats?: any;
  currentTimeRange?: number;
}

export function InsightsAIHelper({ stats, currentTimeRange }: InsightsAIHelperProps) {
  const [showChat, setShowChat] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleQuickQuestion = (question: string) => {
    setShowChat(true);
    // Small delay to ensure chat component is rendered before setting question
    setTimeout(() => {
      setSelectedQuestion(question);
    }, 100);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'temperature':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'rainfall':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'risk':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'trends':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!showChat) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Climate Analyst</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask me to explain any climate statistics
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Context Info */}
          {stats && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Current Data Summary:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Time Range: Last {currentTimeRange} days</li>
                <li>• Avg Temperature: {stats.temperature?.average?.toFixed(1)}°C</li>
                <li>• Total Rainfall: {stats.precipitation?.total?.toFixed(1)}mm</li>
                <li>• Temperature Trend: {stats.temperature?.trend}</li>
              </ul>
            </div>
          )}

          {/* Quick Questions */}
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Quick Questions
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className={`justify-start text-left h-auto py-3 hover:shadow-md transition-all ${getCategoryColor(
                      q.category
                    )} border`}
                    onClick={() => handleQuickQuestion(q.question)}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{q.question}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Question */}
          <Button
            onClick={() => setShowChat(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Bot className="h-4 w-4 mr-2" />
            Ask Custom Question
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-[600px]">
      <CardContent className="p-0 h-full">
        <div className="relative h-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChat(false);
              setSelectedQuestion(null);
            }}
            className="absolute top-2 right-2 z-10"
          >
            Back
          </Button>
          <div className="h-full">
            <ClimateChat agent="climateAnalyst" initialMessage={selectedQuestion || undefined} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
