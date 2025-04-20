import React from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { 
  LayoutDashboardIcon, 
  ClipboardListIcon, 
  DollarSignIcon, 
  BarChartIcon, 
  SettingsIcon, 
  MessageSquareIcon,
  VideoIcon,
  UsersIcon,
  Package2Icon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export default function AdvisorDashboardSidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/advisor-dashboard', 
      icon: <LayoutDashboardIcon className="w-5 h-5" /> 
    },
    { 
      name: 'Bookings', 
      href: '/advisor-orders', 
      icon: <ClipboardListIcon className="w-5 h-5" /> 
    },
    { 
      name: 'Withdrawals', 
      href: '/advisor-withdrawals', 
      icon: <DollarSignIcon className="w-5 h-5" /> 
    },
    { 
      name: 'Statistics', 
      href: '/advisor-statistics', 
      icon: <BarChartIcon className="w-5 h-5" /> 
    },
    { 
      name: 'Services', 
      href: '/advisor-services', 
      icon: <Package2Icon className="w-5 h-5" /> 
    },
    { 
      name: 'Settings', 
      href: '/advisor-settings', 
      icon: <SettingsIcon className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="w-64 border-r h-full flex flex-col bg-background">
      <div className="p-6 border-b">
        <Link href="/advisor-dashboard">
          <a className="flex items-center space-x-2">
            <span className="font-bold text-xl">Advisor Portal</span>
          </a>
        </Link>
      </div>
      
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || ''} alt={user?.name || 'Advisor'} />
            <AvatarFallback>
              {user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.name || 'Advisor'}</p>
            <p className="text-xs text-muted-foreground">Spiritual Advisor</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="space-y-1">
          <Link href="/messages">
            <a className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <MessageSquareIcon className="w-5 h-5" />
              <span>Messages</span>
            </a>
          </Link>
          <Link href="/advisor-profile">
            <a className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <UsersIcon className="w-5 h-5" />
              <span>View Public Profile</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}