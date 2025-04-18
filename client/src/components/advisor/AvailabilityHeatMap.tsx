import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/components/WebSocketProvider';

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
  const { socket } = useWebSocket();

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

    // For demo purposes, generate sample heat map data if API is not available
    const generateSampleData = () => {
      const sampleData: HeatMapData[] = [];
      
      days.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
          // Generate more realistic patterns - higher activity in evenings and weekends
          let baseAdvisorCount = 2; // Base count
          
          // Evenings (5pm-10pm) have more advisors
          if (hour >= 17 && hour <= 22) {
            baseAdvisorCount += 5;
          }
          
          // Morning/afternoon (9am-5pm) have moderate advisors
          else if (hour >= 9 && hour <= 17) {
            baseAdvisorCount += 3;
          }
          
          // Weekend boost
          if (day === 'Saturday' || day === 'Sunday') {
            baseAdvisorCount += 2;
          }
          
          // Add some randomness
          const randomFactor = Math.floor(Math.random() * 3); 
          const advisorCount = Math.max(0, baseAdvisorCount + randomFactor);
          
          // Calculate average wait time (inversely related to advisor count)
          const averageWaitTime = advisorCount > 0 ? Math.round(30 / advisorCount) : 0;
          
          sampleData.push({
            day,
            hour,
            advisorCount,
            averageWaitTime
          });
        }
      });
      
      setHeatMapData(sampleData);
      calculateInsights(sampleData);
      setLoading(false);
    };

    // Fetch data or generate sample data based on API availability
    fetchHeatMapData().catch(() => {
      console.log('Falling back to sample data');
      generateSampleData();
    });
  }, []);

  // Listen for real-time advisor status updates
  useEffect(() => {
    if (socket) {
      const handleStatusUpdate = (data: any) => {
        if (data.type === 'advisorStatusUpdate') {
          // Update current advisor count
          setCurrentAdvisorCount(data.onlineAdvisorsCount || 0);
          
          // Update heat map for current hour if available
          const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Adjust Sunday
          const currentHour = new Date().getHours();
          
          setHeatMapData(prevData => 
            prevData.map(item => {
              if (item.day === currentDay && item.hour === currentHour) {
                return { ...item, advisorCount: data.onlineAdvisorsCount || item.advisorCount };
              }
              return item;
            })
          );
        }
      };

      // Mock a real-time update for demo purposes
      const mockRealTimeUpdates = () => {
        const mockUpdate = {
          type: 'advisorStatusUpdate',
          onlineAdvisorsCount: Math.floor(Math.random() * 10) + 1 // 1-10 advisors online
        };
        handleStatusUpdate(mockUpdate);
      };

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStatusUpdate(data);
        } catch (error) {
          console.error('Error processing websocket message:', error);
        }
      });

      // For demo, update randomly every 30 seconds
      const intervalId = setInterval(mockRealTimeUpdates, 30000);
      
      // Initial mock update
      setTimeout(mockRealTimeUpdates, 1000);

      return () => {
        clearInterval(intervalId);
        socket.removeEventListener('message', handleStatusUpdate);
      };
    }
  }, [socket]);

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

  const getHeatMapTextClass = (count: number) => {
    if (count < 5) return 'text-gray-800';
    return 'text-white';
  };

  const getCurrentViewData = () => {
    if (currentView === 'today') {
      const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Adjust for Sunday
      return heatMapData.filter(d => d.day === today);
    }
    return heatMapData;
  };

  // Render loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-2/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
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
          <div className="space-y-4">
            {/* Availability Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-sm text-purple-700">Online Now</div>
                <div className="text-2xl font-bold text-purple-900">{currentAdvisorCount}</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-sm text-purple-700">Most Active Day</div>
                <div className="text-lg font-bold text-purple-900">{currentMostActiveDay}</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-sm text-purple-700">Peak Hours</div>
                <div className="text-lg font-bold text-purple-900">{currentMostActiveTime}</div>
              </div>
            </div>

            {/* Heat Map */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-max">
                {currentView === 'week' ? (
                  <>
                    {/* Day labels for week view */}
                    <div className="flex">
                      <div className="w-16"></div> {/* Empty cell for hour labels */}
                      {days.map(day => (
                        <div key={day} className="flex-1 text-center font-medium text-sm py-1">
                          {day.substring(0, 3)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Heat map grid for week view */}
                    {hourLabels.map((hourLabel, hourIndex) => (
                      <div key={hourLabel} className="flex h-8">
                        <div className="w-16 text-xs flex items-center justify-end pr-2 text-gray-500">
                          {hourLabel}
                        </div>
                        {days.map(day => {
                          const cellData = heatMapData.find(d => d.day === day && d.hour === hourIndex);
                          const count = cellData?.advisorCount || 0;
                          return (
                            <div 
                              key={`${day}-${hourIndex}`} 
                              className={`flex-1 border border-white flex items-center justify-center ${getHeatMapColorClass(count)} ${getHeatMapTextClass(count)}`}
                            >
                              {count > 0 && (
                                <span className="text-xs font-medium">{count}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                ) : (
                  // Today view
                  <>
                    <h3 className="text-lg font-medium mb-2">
                      Today ({days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]})
                    </h3>
                    
                    <div className="space-y-2">
                      {hourLabels.map((hourLabel, hourIndex) => {
                        const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
                        const cellData = heatMapData.find(d => d.day === today && d.hour === hourIndex);
                        const count = cellData?.advisorCount || 0;
                        const waitTime = cellData?.averageWaitTime || 0;
                        const isCurrentHour = new Date().getHours() === hourIndex;
                        
                        return (
                          <div 
                            key={hourIndex}
                            className={`flex items-center p-2 rounded-md ${isCurrentHour ? 'border-2 border-purple-500' : ''}`}
                          >
                            <div className="w-16 text-sm">{hourLabel}</div>
                            <div className="flex-1">
                              <div className="h-6 relative">
                                <div 
                                  className={`absolute top-0 left-0 h-full ${getHeatMapColorClass(count)}`}
                                  style={{ width: `${Math.min(100, count * 10)}%` }}
                                ></div>
                                <div className="absolute top-0 left-2 h-full flex items-center">
                                  <span className={`text-xs font-medium ${getHeatMapTextClass(count)}`}>
                                    {count} advisors {waitTime > 0 ? `• ~${waitTime}min wait` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isCurrentHour && (
                              <div className="ml-2 text-xs bg-purple-100 text-purple-800 py-1 px-2 rounded">
                                Current Hour
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>
                <span className="font-medium">Note:</span> This heat map shows historical advisor 
                availability patterns and current online status. Actual availability may vary.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}