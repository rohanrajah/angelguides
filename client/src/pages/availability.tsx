import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AvailabilityHeatMap } from '@/components/advisor/AvailabilityHeatMap';
import { Link } from 'wouter';
import { ChevronRight, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWebSocketData } from '@/hooks/useWebSocketData';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

export default function AdvisorAvailabilityPage() {
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track online advisors
  const { data: statusUpdate } = useWebSocketData({
    messageType: 'advisor_status_change',
  });
  
  // Fetch advisors
  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const response = await apiRequest('GET', '/api/advisors');
        if (response.ok) {
          const data = await response.json();
          setAdvisors(data);
        }
      } catch (error) {
        console.error('Error fetching advisors:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvisors();
  }, []);
  
  // Update advisor online status when WebSocket data changes
  useEffect(() => {
    if (statusUpdate && typeof statusUpdate.advisorId === 'number' && typeof statusUpdate.isOnline === 'boolean') {
      setAdvisors(prevAdvisors => 
        prevAdvisors.map(advisor => 
          advisor.id === statusUpdate.advisorId 
            ? { ...advisor, online: statusUpdate.isOnline }
            : advisor
        )
      );
    }
  }, [statusUpdate]);
  
  // Get online advisor count
  const onlineAdvisorsCount = advisors.filter(advisor => advisor.online).length;
  
  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-heading font-bold">Advisor Availability</h1>
          <div className="ml-auto flex items-center">
            <Link href="/advisors">
              <Button variant="ghost" className="flex items-center">
                View All Advisors
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <AvailabilityHeatMap />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Available Now</h2>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                        <div className="ml-4 flex-grow">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : onlineAdvisorsCount > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {advisors
                      .filter(advisor => advisor.online)
                      .map(advisor => (
                        <Link key={advisor.id} href={`/advisors/${advisor.id}`}>
                          <a className="flex items-center p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              {advisor.avatar ? (
                                <img src={advisor.avatar} alt={advisor.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                                  {advisor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="font-medium">{advisor.name}</h3>
                                <div className="ml-2 w-2 h-2 rounded-full bg-green-500"></div>
                              </div>
                              <p className="text-sm text-neutral-dark mt-1 line-clamp-1">{advisor.bio}</p>
                              <div className="text-xs text-primary font-medium mt-1">${advisor.chatRate}/min</div>
                            </div>
                          </a>
                        </Link>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-neutral" />
                    </div>
                    <h3 className="font-medium mb-1">No Advisors Online</h3>
                    <p className="text-sm text-neutral-dark">
                      Check the heat map to see when advisors are typically available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Real-time Updates</AlertTitle>
              <AlertDescription>
                This page updates in real-time as advisors come online and go offline.
                The heat map shows historical patterns to help you plan ahead.
              </AlertDescription>
            </Alert>
            
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">How to Schedule a Session</h3>
              <ol className="list-decimal list-inside text-sm space-y-2">
                <li>Find an advisor from the available list or browse all advisors</li>
                <li>Visit their profile to see their specialties and rates</li>
                <li>Choose your preferred consultation type (chat, voice, or video)</li>
                <li>Book a time slot or connect immediately if they're online</li>
              </ol>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}