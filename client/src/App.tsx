import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Layout Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingAngelaBubble from "@/components/chat/FloatingAngelaBubble";
import AngelaOnboarding from "@/components/onboarding/AngelaOnboarding";
import AngelaGuidedTour from "@/components/onboarding/AngelaGuidedTour";

// Pages
import Home from "@/pages/home";
import Welcome from "@/pages/welcome";
import Advisors from "@/pages/advisors";
import AdvisorProfile from "@/pages/advisor-profile";
import Bookings from "@/pages/bookings";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import TopupPage from "@/pages/topup";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [location] = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/home" component={Home} />
      <Route path="/advisors" component={Advisors} />
      <Route path="/advisors/:id" component={AdvisorProfile} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/topup" component={TopupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
    if (!isWelcomePage && !loading) {
      const hasCompletedOnboarding = localStorage.getItem('angelaOnboardingComplete') === 'true';
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isWelcomePage, loading]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/me');
        const user = await response.json();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
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
      <div className={`min-h-screen flex flex-col ${isWelcomePage ? 'bg-transparent' : 'bg-neutral-lightest'}`}>
        {!isWelcomePage && <Header user={currentUser} />}
        <main className="flex-grow main-content">
          <Router />
        </main>
        {!isWelcomePage && <Footer />}
        {/* Angela AI bubble appears on all pages */}
        <FloatingAngelaBubble userId={currentUser?.id || 5} />
        
        {/* Angela AI Onboarding Modal */}
        {showOnboarding && !isWelcomePage && (
          <AngelaOnboarding onComplete={handleOnboardingComplete} />
        )}
        
        {/* Angela AI Guided Tour */}
        {showGuidedTour && !isWelcomePage && (
          <AngelaGuidedTour 
            steps={tourSteps} 
            isActive={showGuidedTour}
            onComplete={handleGuidedTourComplete} 
          />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
