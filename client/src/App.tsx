import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Layout Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingAngelaBubble from "@/components/chat/FloatingAngelaBubble";

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
  const [location] = useLocation();
  
  // Check if we're on the welcome page
  const isWelcomePage = location === "/";

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

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen flex flex-col ${isWelcomePage ? 'bg-transparent' : 'bg-neutral-lightest'}`}>
        {!isWelcomePage && <Header user={currentUser} />}
        <main className="flex-grow">
          <Router />
        </main>
        {!isWelcomePage && <Footer />}
        {!isWelcomePage && <FloatingAngelaBubble userId={currentUser?.id || 5} />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
