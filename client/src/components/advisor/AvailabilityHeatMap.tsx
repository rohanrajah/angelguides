import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocketData } from '@/hooks/useWebSocketData';

// Types
interface HeatMapData {
  day: string;
  hour: number;
  advisorCount: number;
  averageWaitTime?: number; // in minutes
}

interface AvailabilityHeatMapProps {
  className?: string;
}

// Message type for advisor status updates from WebSocket
interface AdvisorStatusUpdate {
  advisorId: number;
  isOnline: boolean;
  onlineAdvisorsCount: number;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const hourLabels = [
  '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', 
  '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', 
  '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'
];

export function AvailabilityHeatMap({ className }: AvailabilityHeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [currentView, setCurrentView] = useState<'week' | 'today'>('week');
  const [loading, setLoading] = useState(true);
  const [currentAdvisorCount, setCurrentAdvisorCount] = useState(0);
  const [currentMostActiveDay, setCurrentMostActiveDay] = useState('');
  const [currentMostActiveTime, setCurrentMostActiveTime] = useState('');
  
  // Use WebSocket data for real-time advisor status updates
  const { data: statusUpdate } = useWebSocketData<AdvisorStatusUpdate>({
    messageType: 'advisor_status_change',
    transformData: (payload) => payload
  });
  
  // Update advisor count when WebSocket data changes
  useEffect(() => {
    if (statusUpdate && typeof statusUpdate.onlineAdvisorsCount === 'number') {
      setCurrentAdvisorCount(statusUpdate.onlineAdvisorsCount);
      
      // Also update the heat map data for the current time slot
      const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Adjust Sunday
      const currentHour = new Date().getHours();
      
      setHeatMapData(prevData => 
        prevData.map(item => {
          if (item.day === currentDay && item.hour === currentHour) {
            return { ...item, advisorCount: statusUpdate.onlineAdvisorsCount };
          }
          return item;
        })
      );
    }
  }, [statusUpdate]);

  // Fetch initial heat map data
  useEffect(() => {
    const fetchHeatMapData = async () => {
      try {
        const response = await apiRequest('GET', '/api/advisor-availability/heatmap');
        if (response.ok) {
          const data = await response.json();
          setHeatMapData(data);
          
          // Calculate most active day and time
          calculateInsights(data);
        }
      } catch (error) {
        console.error('Error fetching heat map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatMapData();
  }, []);
  
  const calculateInsights = (data: HeatMapData[]) => {
    // Find most active day
    const dayTotals = days.map(day => ({
      day,
      total: data.filter(d => d.day === day).reduce((sum, item) => sum + item.advisorCount, 0)
    }));
    
    const mostActiveDay = dayTotals.reduce((max, day) => 
      day.total > max.total ? day : max, { day: '', total: 0 }
    ).day;
    
    setCurrentMostActiveDay(mostActiveDay);

    // Find most active time
    const hourTotals = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: data.filter(d => d.hour === hour).reduce((sum, item) => sum + item.advisorCount, 0)
    }));
    
    const mostActiveHour = hourTotals.reduce((max, hour) => 
      hour.total > max.total ? hour : max, { hour: 0, total: 0 }
    ).hour;
    
    setCurrentMostActiveTime(hourLabels[mostActiveHour]);

    // Calculate current online advisors (use actual day and hour)
    const now = new Date();
    const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Sunday
    const currentHour = now.getHours();
    const currentData = data.find(d => d.day === currentDay && d.hour === currentHour);
    setCurrentAdvisorCount(currentData?.advisorCount || 0);
  };

  const getHeatMapColorClass = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 3) return 'bg-green-100';
    if (count < 5) return 'bg-green-300';
    if (count < 8) return 'bg-green-500';
    return 'bg-green-700';
  };
  
  // Get current day data for "Today" view
  const getTodayData = () => {
    const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    return heatMapData.filter(item => item.day === currentDay);
  };
  
  // Get wait time status
  const getWaitTimeStatus = (waitTime: number) => {
    if (waitTime === 0) return 'No advisors available';
    if (waitTime < 5) return 'Immediate';
    if (waitTime < 15) return 'Short wait';
    return `${waitTime} min`;
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full mb-6" />
          <Skeleton className="h-12 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advisor Availability Heat Map</span>
            <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{currentAdvisorCount} Online Now</span>
            </div>
          </CardTitle>
          <CardDescription>
            See when advisors are most likely to be available for immediate sessions
          </CardDescription>

          <div className="mt-4">
            <Tabs defaultValue="week" onValueChange={(value) => setCurrentView(value as 'week' | 'today')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="week">Full Week</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentView === 'week' ? (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 min-w-[600px]">
                {/* Time column */}
                <div className="mt-6">
                  {hourLabels.map((hour, idx) => (
                    <div key={`hour-${idx}`} className="h-6 text-xs text-right pr-2 mb-1">{hour}</div>
                  ))}
                </div>
                
                {/* Day columns */}
                {days.map((day, dayIdx) => (
                  <div key={`day-${day}`} className="flex flex-col">
                    <div className="h-6 text-xs font-medium text-center">{day}</div>
                    
                    {hourLabels.map((_, hourIdx) => {
                      const dataPoint = heatMapData.find(
                        d => d.day === day && d.hour === hourIdx
                      );
                      
                      // Check if this is the current day and hour
                      const now = new Date();
                      const isCurrentDay = day === days[now.getDay() === 0 ? 6 : now.getDay() - 1];
                      const isCurrentHour = hourIdx === now.getHours();
                      const isNow = isCurrentDay && isCurrentHour;
                      
                      return (
                        <div
                          key={`${day}-${hourIdx}`}
                          className={`
                            h-6 mb-1 rounded group relative cursor-help
                            ${getHeatMapColorClass(dataPoint?.advisorCount || 0)}
                            ${isNow ? 'ring-2 ring-offset-1 ring-primary' : ''}
                          `}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg rounded-md p-2 text-xs w-36 z-10">
                            <p className="font-medium">{day} @ {hourLabels[hourIdx]}</p>
                            <div className="flex justify-between mt-1">
                              <span>Advisors:</span>
                              <span className="font-medium">{dataPoint?.advisorCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Wait:</span>
                              <span className="font-medium">
                                {getWaitTimeStatus(dataPoint?.averageWaitTime || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Today view
            <div className="mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Today's Availability</h3>
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <div className="space-y-4">
                {getTodayData().map((dataPoint) => {
                  const now = new Date();
                  const isCurrentHour = dataPoint.hour === now.getHours();
                  const isPastHour = dataPoint.hour < now.getHours();
                  
                  // Skip past hours
                  if (isPastHour) return null;
                  
                  return (
                    <div 
                      key={`today-${dataPoint.hour}`}
                      className={`flex items-center p-3 rounded-lg ${
                        isCurrentHour ? 'bg-primary/10' : 'bg-neutral-50'
                      }`}
                    >
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-sm font-medium">{hourLabels[dataPoint.hour]}</div>
                      </div>
                      
                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`
                              w-3 h-3 rounded-full mr-2
                              ${getHeatMapColorClass(dataPoint.advisorCount)}
                            `}></div>
                            <span className="text-sm">{dataPoint.advisorCount} advisor{dataPoint.advisorCount !== 1 ? 's' : ''}</span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {getWaitTimeStatus(dataPoint.averageWaitTime || 0)}
                          </div>
                        </div>
                        
                        {isCurrentHour && (
                          <div className="text-xs mt-1 flex items-center text-primary">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Current hour</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm">Most Active Day:</span>
              <span className="ml-2 font-medium">{currentMostActiveDay}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm">Peak Time:</span>
              <span className="ml-2 font-medium">{currentMostActiveTime}</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-4">
            <p>
              <span className="font-medium">Note:</span> This heat map shows historical advisor 
              availability patterns and current online status. Actual availability may vary.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}