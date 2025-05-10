import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Check, Clock, Calendar, Phone, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WorkingHour, User, UserType } from '@shared/schema';

type QueuePosition = {
  position: number;
  total: number;
};

const AdvisorCallCenter = () => {
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState<string>('Connect to the Angels and spirit guides.!!!');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [queuePosition, setQueuePosition] = useState<QueuePosition>({ position: 2, total: 7 });
  const [advisorId, setAdvisorId] = useState<string>('946');
  const [badge, setBadge] = useState<string>('Top Rated');

  // Fetch advisor profile
  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  // Fetch advisor's working hours
  const { data: workingHours = [], isLoading: isLoadingHours } = useQuery<WorkingHour[]>({
    queryKey: [`/api/advisors/${user?.id}/working-hours`],
    enabled: !!user?.id,
  });

  // Update status message mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest('POST', `/api/advisors/${user?.id}/status-message`, { message });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Your status message has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your status message.",
        variant: "destructive",
      });
    }
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (available: boolean) => {
      const res = await apiRequest('PATCH', `/api/advisors/${user?.id}/status`, { online: available });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: isAvailable ? "You are now offline" : "You are now online",
        description: isAvailable ? "Clients can no longer request sessions." : "Clients can now request sessions with you.",
      });
      setIsAvailable(!isAvailable);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    }
  });

  // Add working hour mutation
  const addWorkingHourMutation = useMutation({
    mutationFn: async (day: string) => {
      const res = await apiRequest('POST', `/api/advisors/${user?.id}/working-hours`, { 
        date: day,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule updated",
        description: "Your working hours have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}/working-hours`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your working hours.",
        variant: "destructive",
      });
    }
  });

  // Effect to set initial state from user data
  useEffect(() => {
    if (user) {
      setIsAvailable(user.online || false);
      if (user.statusMessage) {
        setStatusMessage(user.statusMessage);
      }
    }
  }, [user]);

  // Handle saving status message
  const handleSaveStatusMessage = () => {
    updateStatusMutation.mutate(statusMessage);
  };

  // Handle toggling availability
  const handleToggleAvailability = () => {
    toggleAvailabilityMutation.mutate(!isAvailable);
  };

  // Handle calendar day click
  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    addWorkingHourMutation.mutate(formattedDate);
  };

  // Check if a date has working hours
  const isWorkingDay = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return workingHours.some(hour => hour.date === formattedDate);
  };

  // Render the working hours calendar
  const renderCalendar = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Scheduled working hours
            </Badge>
          </div>
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm">
                <Clock className="h-4 w-4 mr-1" />
                Time Zone
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Time Zone Settings</h4>
                <p className="text-sm text-muted-foreground">
                  The hours and dates you see in this calendar are displayed according to your TIME ZONE.
                </p>
                <p className="text-sm">
                  You can edit your TIME ZONE in your <span className="font-medium text-primary">psychic settings</span>.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const prevMonth = new Date(currentMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setCurrentMonth(prevMonth);
              }}
            >
              &lt;
            </Button>
            <h3 className="text-lg font-medium mx-4">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCurrentMonth(nextMonth);
              }}
            >
              &gt;
            </Button>
          </div>
          
          <div className="border rounded-md p-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onDayClick={handleDayClick}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md bg-white"
              modifiers={{
                working: date => isWorkingDay(date)
              }}
              modifiersClassNames={{
                working: "bg-green-100 font-medium text-green-700"
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    isWorkingDay(date) && "relative"
                  )}>
                    {date.getDate()}
                    {isWorkingDay(date) && (
                      <div className="absolute bottom-0 w-6 h-1 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ),
              }}
            />
          </div>
          
          <p className="text-sm text-center text-muted-foreground mt-4">
            Click on any future days or the current day to add working hours.
          </p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-4">
        {/* Top status bar */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">Active Psychic: {user?.name || 'yogiRohan'}</span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-700">My Psychic ID: {advisorId}</span>
                <HoverCard>
                  <HoverCardTrigger>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">This is your unique ID as an advisor on Angelguides.ai</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <span className="font-medium text-gray-700">${user?.chatRate ? (user.chatRate / 100).toFixed(2) : '8.54'} available for withdrawal</span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-700">My Badge: {badge}</span>
                <span className="text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                </span>
              </div>
            </div>
            <div>
              <Badge variant="outline" className="font-medium bg-gray-100 text-gray-700">
                Queue position to appear first: {queuePosition.position}/{queuePosition.total}
              </Badge>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center mb-3 text-sm">
          <a href="/" className="text-gray-500 hover:text-primary">Home</a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">Call Center</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">Call Center</h1>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            {/* Phone icon and call center text */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Call Center</h2>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="text-green-600 font-bold">
                {isAvailable ? "AVAILABLE" : "OFFLINE"}
              </div>
              <Button
                variant="outline"
                onClick={handleToggleAvailability}
                className={cn(
                  "transition-colors border-red-600 text-red-600 hover:bg-red-50"
                )}
              >
                Go Offline
              </Button>
            </div>

            {/* Status Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Message
              </label>
              <div className="flex items-start gap-3">
                <Textarea 
                  value={statusMessage} 
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Connect to the Angels and spirit guides.!!!"
                  className="min-h-[60px]"
                />
                <Button onClick={handleSaveStatusMessage} className="whitespace-nowrap">
                  Save
                </Button>
              </div>
            </div>

            {/* Time Zone Info */}
            <div className="text-center mb-4 text-gray-600 text-sm">
              <p>The hours and dates you see in this calendar are displayed according to your TIME ZONE.</p>
              <p>You can edit the TIME ZONE in your <span className="text-primary font-medium">psychic settings</span>.</p>
            </div>

            {/* Month selector */}
            <div className="flex justify-center items-center mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-medium mx-4">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="ml-2"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-green-600 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <span className="text-sm">Scheduled working hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-blue-600 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-sm">Upcoming events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-gray-400 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                </div>
                <span className="text-sm">Past events</span>
              </div>
            </div>

            <p className="text-sm text-center mb-6 text-gray-600">
              Click on any future days or the current day to add working hours.
            </p>

            {/* Calendar */}
            <div className="border rounded-md mb-4">
              <div className="grid grid-cols-7 text-center border-b bg-gray-50">
                <div className="py-2 font-medium text-gray-600">SUN</div>
                <div className="py-2 font-medium text-gray-600">MON</div>
                <div className="py-2 font-medium text-gray-600">TUE</div>
                <div className="py-2 font-medium text-gray-600">WED</div>
                <div className="py-2 font-medium text-gray-600">THU</div>
                <div className="py-2 font-medium text-gray-600">FRI</div>
                <div className="py-2 font-medium text-gray-600">SAT</div>
              </div>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                onDayClick={handleDayClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-b-md bg-white"
                modifiers={{
                  working: date => isWorkingDay(date)
                }}
                modifiersClassNames={{
                  working: "bg-green-100 font-medium text-green-700 relative"
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center",
                      isWorkingDay(date) && "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-green-600 after:rounded-full"
                    )}>
                      {date.getDate()}
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdvisorCallCenter;