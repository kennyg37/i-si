'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, X, Minimize2, Maximize2 } from 'lucide-react';
import { ClimateChat } from './climate-chat';
import { usePathname } from 'next/navigation';

interface GlobalAIAssistantProps {
  defaultOpen?: boolean;
}

export function GlobalAIAssistant({ defaultOpen = false }: GlobalAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [agent, setAgent] = useState<'climateAnalyst' | 'floodRiskAssessor' | 'agriculturalAdvisor'>('climateAnalyst');
  const pathname = usePathname();

  // Set context-aware agent based on current page
  useEffect(() => {
    if (pathname?.includes('/insights')) {
      setAgent('climateAnalyst');
    } else if (pathname?.includes('/map')) {
      setAgent('floodRiskAssessor');
    } else {
      setAgent('climateAnalyst');
    }
  }, [pathname]);

  // Toggle open/close
  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleToggle}
            size="lg"
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Bot className="h-6 w-6" />
          </Button>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-16'
              : 'bottom-6 right-6 w-96 h-[600px]'
          }`}
        >
          <Card className="h-full w-full shadow-2xl border-2">
            {isMinimized ? (
              // Minimized Header
              <div className="h-full flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggle}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Full Chat Interface
              <>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 bg-background border-b px-4 py-2 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">AI Assistant</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMinimize}
                      className="h-8 w-8 p-0"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggle}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Chat Content */}
                <CardContent className="h-full pt-16 pb-2 px-2">
                  <div className="h-full">
                    <ClimateChat agent={agent} />
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
