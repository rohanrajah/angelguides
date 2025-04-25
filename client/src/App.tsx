import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Layout Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingAngelaBubble from "@/components/chat/FloatingAngelaBubble";
import AngelaOnboarding from "@/components/onboarding/AngelaOnboarding";
import AngelaGuidedTour from "@/components/onboarding/AngelaGuidedTour";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Pages
import Home from "@/pages/home";
import Welcome from "@/pages/welcome";
import Advisors from "@/pages/advisors";
import AdvisorProfile from "@/pages/advisor-profile";
import Bookings from "@/pages/bookings";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import ProfileSetup from "@/pages/profile-setup";
import BulkDataEntry from "@/pages/bulk-data-entry";
import TopupPage from "@/pages/topup";
import Transactions from "@/pages/transactions";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import TestPage from "@/pages/test";
import TestVideo from "@/pages/test-video";
import Availability from "@/pages/availability";
import AngelaChat from "@/pages/angela-chat";

// Advisor Dashboard Pages
import AdvisorDashboard from "@/pages/advisor-dashboard";
import AdvisorOrdersHistory from "@/pages/advisor-orders-history";
import AdvisorWithdrawals from "@/pages/advisor-withdrawals";
import AdvisorStatistics from "@/pages/advisor-statistics";
import AdvisorServices from "@/pages/advisor-services";
import AdvisorSettings from "@/pages/advisor-settings";

import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "./lib/queryClient";

// Component to protect admin routes
function AdminRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match] = useRoute(rest.path);
  
  useEffect(() => {
    // If the route matches and user is not an admin, redirect
    if (match && (!user || user.userType !== "ADMIN")) {
      navigate("/dashboard");
    }
  }, [match, user, navigate]);
  
  // If user is an admin, render the component, otherwise null (redirect happens in useEffect)
  return match && user?.userType === "ADMIN" ? <Component /> : null;
}

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // Determine if the user is an advisor
  const isAdvisor = user?.userType === "ADVISOR";
  const isAdmin = user?.userType === "ADMIN";
  
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/advisors" component={Advisors} />
      <Route path="/advisors/:id" component={AdvisorProfile} />
      <Route path="/availability" component={Availability} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/bulk-data-entry" component={BulkDataEntry} />
      <Route path="/topup" component={TopupPage} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/test" component={TestPage} />
      <Route path="/test-video" component={TestVideo} />
      <Route path="/angela-chat" component={AngelaChat} />

      {/* Advisor Dashboard Routes */}
      <Route path="/advisor-dashboard" component={AdvisorDashboard} />
      <Route path="/advisor-orders" component={AdvisorOrdersHistory} />
      <Route path="/advisor-withdrawals" component={AdvisorWithdrawals} />
      <Route path="/advisor-statistics" component={AdvisorStatistics} />
      <Route path="/advisor-services" component={AdvisorServices} />
      <Route path="/advisor-settings" component={AdvisorSettings} />
      
      {/* Admin Routes */}
      <AdminRoute path="/admin/users" component={Dashboard} />
      <AdminRoute path="/admin/user/:userId" component={Dashboard} />
      <AdminRoute path="/admin/transactions" component={Dashboard} />
      <AdminRoute path="/admin/payouts" component={Dashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [seenWelcome, setSeenWelcome] = useState<boolean>(false);
  
  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  
  // Check if we're on the welcome page
  const isWelcomePage = location === "/";

  // Check if user has seen welcome page
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    setSeenWelcome(hasSeenWelcome);
    
    // If not on welcome page and has not seen welcome, redirect to welcome page
    if (location !== '/' && !hasSeenWelcome) {
      setLocation('/');
    }
  }, [location, setLocation]);
  
  // Check if user has completed onboarding
  useEffect(() => {
    if (!isWelcomePage) {
      const hasCompletedOnboarding = localStorage.getItem('angelaOnboardingComplete') === 'true';
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isWelcomePage]);

  // Tour steps for the guided tour
  const tourSteps = [
    {
      target: '.angela-bubble', // Target the Angela bubble
      title: 'Meet Angela',
      content: 'Click on this bubble anytime you need guidance or want to match with an advisor.',
      position: 'left' as const
    },
    {
      target: '.header-nav', // Target the header navigation
      title: 'Browse Advisors',
      content: 'Explore our community of spiritual advisors and find your perfect match.',
      position: 'bottom' as const
    },
    {
      target: '.main-content', // Target the main content area
      title: 'Your Spiritual Journey',
      content: 'This is where your personalized spiritual content will appear.',
      position: 'top' as const
    }
  ];
  
  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowGuidedTour(true);
  };
  
  // Handle guided tour completion
  const handleGuidedTourComplete = () => {
    setShowGuidedTour(false);
    localStorage.setItem('angelaGuidedTourComplete', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppWithAuth 
          isWelcomePage={isWelcomePage}
          showOnboarding={showOnboarding}
          showGuidedTour={showGuidedTour}
          tourSteps={tourSteps}
          onOnboardingComplete={handleOnboardingComplete}
          onGuidedTourComplete={handleGuidedTourComplete}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppWithAuth({ 
  isWelcomePage, 
  showOnboarding, 
  showGuidedTour, 
  tourSteps, 
  onOnboardingComplete, 
  onGuidedTourComplete 
}: { 
  isWelcomePage: boolean, 
  showOnboarding: boolean,
  showGuidedTour: boolean,
  tourSteps: any[],
  onOnboardingComplete: () => void,
  onGuidedTourComplete: () => void
}) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-lightest">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 text-primary">
            <i className="fas fa-spa text-4xl"></i>
          </div>
          <p className="mt-4 text-neutral-dark font-heading text-lg">
            Connecting to the spiritual realm...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebSocketProvider 
      userId={user?.id} 
      userType={user?.userType}
    >
      <div className={`min-h-screen flex flex-col ${isWelcomePage ? 'bg-transparent' : 'bg-neutral-lightest'}`}>
        {!isWelcomePage && <Header user={user} />}
        <main className="flex-grow main-content">
          <Router />
        </main>
        {!isWelcomePage && <Footer />}
        {/* Angela AI bubble appears on all pages */}
        <FloatingAngelaBubble userId={user?.id || 5} />
        
        {/* Angela AI Onboarding Modal */}
        {showOnboarding && !isWelcomePage && (
          <AngelaOnboarding onComplete={onOnboardingComplete} />
        )}
        
        {/* Angela AI Guided Tour */}
        {showGuidedTour && !isWelcomePage && (
          <AngelaGuidedTour 
            steps={tourSteps} 
            isActive={showGuidedTour}
            onComplete={onGuidedTourComplete} 
          />
        )}
      </div>
    </WebSocketProvider>
  );
}

export default App;
