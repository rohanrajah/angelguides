import React, { ReactNode } from 'react';
import AdvisorDashboardSidebar from './AdvisorDashboardSidebar';
import { BellIcon, LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdvisorDashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdvisorDashboardLayout({ 
  children, 
  title = "Dashboard"
}: AdvisorDashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation('/');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdvisorDashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="px-6 py-4 border-b bg-background flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <span>{user?.name || 'Advisor'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setLocation('/advisor-settings')}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/advisor-withdrawals')}>
                    Earnings & Payments
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-500 focus:text-red-500"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}