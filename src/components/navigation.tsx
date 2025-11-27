'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, BarChart3, Info, Home, Bot, Bell, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LiveLocation } from './live-location';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Map', href: '/map', icon: Map },
  { name: 'AI Chat', href: '/ai-chat', icon: Bot },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'References', href: '/references', icon: Info },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">I</span>
              </div>
              <span className="font-bold text-xl">I-si</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={pathname === item.href ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'flex items-center space-x-2',
                        pathname === item.href && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <LiveLocation />
          
          <div className="flex items-center space-x-2">
            <Link href="/notifications">
              <Button
                variant={pathname === '/notifications' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Get Alerts</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
