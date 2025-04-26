import { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Home, User, CreditCard, MessageSquare, Calendar, Settings, Star, History, DollarSign, BarChart3, Users, Package, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isAdvisor = user?.userType === 'ADVISOR';
  const isAdmin = user?.userType === 'ADMIN';
  
  // Common navigation items for all user types
  const commonNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/profile', label: 'My Profile', icon: <User className="h-5 w-5" /> },
    { href: '/messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { href: '/sessions', label: 'Session History', icon: <History className="h-5 w-5" /> },
    { href: '/transactions', label: 'Transactions', icon: <CreditCard className="h-5 w-5" /> },
  ];
  
  // Navigation items for regular users
  const userNavItems = [
    { href: '/advisors', label: 'Find Advisors', icon: <Users className="h-5 w-5" /> },
    { href: '/bookings', label: 'My Bookings', icon: <Calendar className="h-5 w-5" /> },
    { href: '/topup', label: 'Top Up Balance', icon: <DollarSign className="h-5 w-5" /> },
  ];
  
  // Navigation items for advisors
  const advisorNavItems = [
    { href: '/advisor-dashboard', label: 'Advisor Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { href: '/advisor-orders', label: 'Order History', icon: <History className="h-5 w-5" /> },
    { href: '/advisor-services', label: 'My Services', icon: <Package className="h-5 w-5" /> },
    { href: '/advisor-reviews', label: 'Reviews', icon: <Star className="h-5 w-5" /> },
    { href: '/advisor-withdrawals', label: 'Withdrawals', icon: <DollarSign className="h-5 w-5" /> },
    { href: '/availability', label: 'Availability', icon: <Calendar className="h-5 w-5" /> },
  ];
  
  // Navigation items for admins
  const adminNavItems = [
    { href: '/admin/users', label: 'User Management', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/transactions', label: 'Transactions', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/payouts', label: 'Advisor Payouts', icon: <DollarSign className="h-5 w-5" /> },
  ];
  
  // Determine which navigation items to show based on user type
  let navItems = [...commonNavItems];
  
  if (isAdvisor) {
    navItems = [...commonNavItems, ...advisorNavItems];
  } else if (isAdmin) {
    navItems = [...commonNavItems, ...adminNavItems];
  } else {
    navItems = [...commonNavItems, ...userNavItems];
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 hidden md:block bg-card border-r border-border">
        <div className="h-full flex flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center font-medium">
              <span className="text-primary text-xl font-bold">AngelGuides</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground
                        ${location === item.href ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'}`}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t px-4 py-4">
            <button
              onClick={() => logoutMutation.mutate()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile header - shown on small screens instead of sidebar */}
      <div className="md:hidden w-full bg-card border-b border-border sticky top-0 z-10">
        <div className="flex h-16 items-center px-4">
          <Link href="/dashboard" className="flex items-center font-medium">
            <span className="text-primary text-xl font-bold">AngelGuides</span>
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}