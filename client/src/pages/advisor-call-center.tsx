import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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

type WorkingHour = {
  id: number;
  advisorId: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

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

  // Fetch advisor profile
  const { data: user } = useQuery({
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold">Call Center</h1>
          <div className="ml-auto">
            <Button
              variant={isAvailable ? "default" : "outline"}
              onClick={handleToggleAvailability}
              className={cn(
                "transition-colors",
                isAvailable ? "bg-green-600 hover:bg-green-700" : "text-red-600 border-red-600 hover:bg-red-50"
              )}
            >
              {isAvailable ? "AVAILABLE" : "Go Offline"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Status information */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Advisor Status</CardTitle>
                  <CardDescription>
                    Your current availability and queue position
                  </CardDescription>
                </div>
                <Badge 
                  variant={isAvailable ? "default" : "outline"} 
                  className={cn(
                    "px-3 py-1 text-base font-medium",
                    isAvailable ? "bg-green-600" : "text-red-600 border-red-600"
                  )}
                >
                  {isAvailable ? "AVAILABLE" : "OFFLINE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3 flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Working Days</p>
                    <p className="font-medium">{workingHours.length || 0} days</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-3 flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Queue Position</p>
                    <p className="font-medium">{queuePosition.position} of {queuePosition.total}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-3 flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Date</p>
                    <p className="font-medium">{format(new Date(), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Status Message</label>
                <div className="flex items-start space-x-2">
                  <Textarea 
                    value={statusMessage} 
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Let clients know what you're focusing on today..."
                    className="min-h-[80px]"
                  />
                  <Button onClick={handleSaveStatusMessage}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Calendar */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xl">Working Hours Calendar</CardTitle>
              <CardDescription>
                Schedule when you're available to take client sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {renderCalendar()}
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-2">
                The hours and dates you see in this calendar are displayed according to your TIME ZONE.
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Scheduled working hours</span>
                <div className="w-3 h-3 rounded-full bg-gray-300 ml-4"></div>
                <span className="text-sm">Unavailable</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdvisorCallCenter;