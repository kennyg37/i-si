'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';

interface ClimateChatProps {
  agent?: 'climateAnalyst' | 'floodRiskAssessor' | 'agriculturalAdvisor';
}

export function ClimateChat({ agent = 'climateAnalyst' }: ClimateChatProps) {
  const [selectedAgent, setSelectedAgent] = useState(agent);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: {
          agent: selectedAgent,
        },
      }),
    [selectedAgent]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const agentInfo = {
    climateAnalyst: {
      name: 'Climate Analyst',
      icon: Sparkles,
      color: 'bg-blue-500',
      description: 'Expert in climate data analysis and risk assessment',
    },
    floodRiskAssessor: {
      name: 'Flood Risk Assessor',
      icon: Bot,
      color: 'bg-red-500',
      description: 'Specialist in flood forecasting and early warning',
    },
    agriculturalAdvisor: {
      name: 'Agricultural Advisor',
      icon: Bot,
      color: 'bg-green-500',
      description: 'Helps farmers adapt to climate conditions',
    },
  };

  const currentAgent = agentInfo[selectedAgent];
  const AgentIcon = currentAgent.icon;

  // Helper to get text content from message parts
  const getMessageText = (message: any) => {
    // Debug log to see message structure
    if (message.role === 'assistant') {
      console.log('Assistant message structure:', message);
    }

    if (!message.parts || !Array.isArray(message.parts)) {
      return '';
    }

    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${currentAgent.color}`}>
              <AgentIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{currentAgent.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {currentAgent.description}
              </p>
            </div>
          </div>
          <Badge variant="secondary">AI</Badge>
        </div>

        {/* Agent Selector */}
        <div className="flex gap-2 mt-4">
          {Object.entries(agentInfo).map(([key, info]) => (
            <Button
              key={key}
              variant={selectedAgent === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAgent(key as typeof selectedAgent)}
              className="flex-1"
            >
              {info.name.split(' ')[0]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <AgentIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Ask me about climate data, flood risks, or agricultural advice for Rwanda.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <p>Try asking:</p>
                <p className="font-mono bg-muted p-2 rounded">
                  "What's the flood risk near Kigali?"
                </p>
                <p className="font-mono bg-muted p-2 rounded">
                  "How much rain fell in the last 30 days?"
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const textContent = getMessageText(message);
            const hasTools = message.parts?.some((part: any) =>
              part.type === 'tool-call' || part.type === 'tool-result'
            );

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className={`p-2 rounded-full ${currentAgent.color} flex-shrink-0`}>
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {textContent && (
                    <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                  )}

                  {/* Tool Calls */}
                  {hasTools && (
                    <div className="mt-2 space-y-1">
                      {message.parts
                        ?.filter((part: any) => part.type === 'tool-call')
                        .map((tool: any, idx: number) => (
                          <div key={idx} className="text-xs opacity-70">
                            <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                            Using {tool.toolName}...
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="p-2 rounded-full bg-primary flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className={`p-2 rounded-full ${currentAgent.color}`}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">
                Error: {error.message}
              </p>
            </div>
          )}

          {/* Invisible div for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about climate data..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
