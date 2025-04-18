import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { User, Specialty, Session } from '@shared/schema';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";

const AdvisorProfile: React.FC = () => {
  const [match, params] = useRoute<{ id: string }>('/advisors/:id');
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // Generate fake available times for demo purposes
  const generateAvailableTimes = (date: Date) => {
    const times = [];
    const day = date.getDay();
    
    // More availability on weekdays, less on weekends
    const startHour = day === 0 || day === 6 ? 10 : 9;
    const endHour = day === 0 || day === 6 ? 15 : 17;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      if (Math.random() > 0.3) { // 70% chance of availability
        times.push(`${hour}:00`);
      }
      if (Math.random() > 0.5) { // 50% chance of availability
        times.push(`${hour}:30`);
      }
    }
    
    return times;
  };
  
  const availableTimes = generateAvailableTimes(selectedDate);
  
  // Get advisor data
  const { data: advisor, isLoading } = useQuery<User & { specialties: Specialty[] }>({
    queryKey: [`/api/advisors/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };
  
  const handleBookSession = async () => {
    if (!advisor || !currentUser || !selectedTime) return;
    
    setBookingInProgress(true);
    
    try {
      // Parse the time string to create a start date
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      // End time is 1 hour after start time
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);
      
      // Send API request to book session
      await apiRequest('POST', '/api/sessions', {
        userId: currentUser.id,
        advisorId: advisor.id,
        startTime,
        endTime,
        notes: `Session with ${advisor.name}`
      });
      
      // Show success message
      toast({
        title: "Session Booked",
        description: `Your session with ${advisor.name} has been scheduled for ${format(startTime, 'MMM d, yyyy')} at ${format(startTime, 'h:mm a')}.`,
      });
      
      // Invalidate sessions cache
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.id}/sessions`] });
      
      // Reset form
      setSelectedTime('');
    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingInProgress(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 animate-pulse">
          <div className="md:w-1/3">
            <div className="bg-neutral-light rounded-xl h-96 w-full"></div>
          </div>
          <div className="md:w-2/3">
            <div className="h-10 bg-neutral-light rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-neutral-light rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-neutral-light rounded w-full mb-2"></div>
            <div className="h-4 bg-neutral-light rounded w-full mb-2"></div>
            <div className="h-4 bg-neutral-light rounded w-3/4 mb-6"></div>
            
            <div className="h-8 bg-neutral-light rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 bg-neutral-light rounded"></div>
              ))}
            </div>
            
            <div className="h-12 bg-neutral-light rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!advisor) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="text-neutral mb-4">
            <i className="fas fa-user-slash text-4xl"></i>
          </div>
          <h2 className="font-heading text-2xl font-semibold mb-4">Advisor Not Found</h2>
          <p className="text-neutral-dark mb-6">
            We couldn't find the advisor you're looking for. They may no longer be available.
          </p>
          <Link href="/advisors">
            <a className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md transition duration-200">
              Browse All Advisors
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="flex flex-col gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Advisor Profile Section */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-xl shadow-soft overflow-hidden sticky top-24">
            <div className="relative">
              <img 
                src={advisor.avatar || "https://via.placeholder.com/600x600"} 
                alt={advisor.name}
                className="w-full h-64 object-cover"
              />
              <div className={`absolute top-4 right-4 ${advisor.online ? 'bg-success' : 'bg-neutral'} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                <i className={`${advisor.online ? 'fas' : 'far'} fa-circle text-xs mr-1`}></i>
                {advisor.online ? 'Online' : 'Away'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h1 className="font-heading text-2xl font-semibold text-neutral-darkest">{advisor.name}</h1>
                <span className="bg-neutral-lightest text-primary text-sm px-2 py-1 rounded-md">
                  ${advisor.minuteRate?.toFixed(2)}/min
                </span>
              </div>
              
              <div className="flex items-center mt-2 mb-4">
                <div className="text-accent">
                  {[1, 2, 3, 4, 5].map(i => (
                    <i key={i} className={`${i <= Math.floor(advisor.rating || 0) ? 'fas' : i - 0.5 === advisor.rating ? 'fas fa-star-half-alt' : 'far'} fa-star`}></i>
                  ))}
                </div>
                <span className="ml-2 text-sm">{advisor.rating?.toFixed(1)} ({advisor.reviewCount} reviews)</span>
              </div>
              
              <div className="border-t border-neutral-light pt-4">
                <h2 className="font-heading text-lg font-medium mb-2">Specialties</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {advisor.specialties?.map(specialty => (
                    <span key={specialty.id} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                      {specialty.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-neutral-light pt-4">
                <h2 className="font-heading text-lg font-medium mb-2">About Me</h2>
                <p className="text-neutral-dark text-sm mb-4">{advisor.bio}</p>
              </div>
              
              <div className="border-t border-neutral-light pt-4">
                <h2 className="font-heading text-lg font-medium mb-2">Availability</h2>
                <p className="text-neutral-dark text-sm">
                  <i className="far fa-clock mr-2"></i>
                  {advisor.availability}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking Section */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-xl shadow-soft p-6 mb-6">
            <h2 className="font-heading text-xl font-semibold text-neutral-darkest mb-4">Book a Session with {advisor.name}</h2>
            
            <div className="mb-6">
              <h3 className="font-medium text-neutral-dark mb-2">1. Select a Date</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  const date = addDays(new Date(), index);
                  const isSelected = selectedDate && 
                    date.getDate() === selectedDate.getDate() && 
                    date.getMonth() === selectedDate.getMonth();
                  
                  return (
                    <motion.button 
                      key={index}
                      className={`p-3 rounded-md text-center ${
                        isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-neutral-lightest hover:bg-neutral-light text-neutral-dark'
                      }`}
                      onClick={() => handleDateSelect(date)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-xs font-medium">{format(date, 'EEE')}</div>
                      <div className="text-lg font-semibold">{format(date, 'd')}</div>
                      <div className="text-xs">{format(date, 'MMM')}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-neutral-dark mb-2">2. Select a Time</h3>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {availableTimes.map(time => {
                    const isSelected = time === selectedTime;
                    const [hour, minute] = time.split(':').map(Number);
                    const timeObj = new Date();
                    timeObj.setHours(hour, minute, 0, 0);
                    
                    return (
                      <motion.button 
                        key={time}
                        className={`py-2 px-4 rounded-md text-center ${
                          isSelected 
                            ? 'bg-primary text-white' 
                            : 'bg-neutral-lightest hover:bg-neutral-light text-neutral-dark'
                        }`}
                        onClick={() => setSelectedTime(time)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {format(timeObj, 'h:mm a')}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-dark italic">No available times on this date.</p>
              )}
            </div>
            
            <div className="bg-neutral-lightest p-4 rounded-lg mb-6">
              <h3 className="font-heading text-lg font-medium mb-2">Session Summary</h3>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-dark">Advisor:</span>
                <span className="font-medium">{advisor.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-dark">Date:</span>
                <span className="font-medium">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-dark">Time:</span>
                <span className="font-medium">
                  {selectedTime ? (() => {
                    const [hour, minute] = selectedTime.split(':').map(Number);
                    const timeObj = new Date();
                    timeObj.setHours(hour, minute, 0, 0);
                    return format(timeObj, 'h:mm a');
                  })() : 'Select a time'}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-dark">Duration:</span>
                <span className="font-medium">60 minutes</span>
              </div>
              <div className="flex justify-between font-medium text-lg mt-4 pt-4 border-t border-neutral-light">
                <span>Total:</span>
                <span className="text-primary">${((advisor.minuteRate || 0) * 60).toFixed(2)}</span>
              </div>
            </div>
            
            <motion.button 
              className={`w-full py-3 rounded-md font-medium text-white ${
                selectedDate && selectedTime 
                  ? 'bg-primary hover:bg-primary-dark' 
                  : 'bg-neutral cursor-not-allowed'
              }`}
              disabled={!selectedDate || !selectedTime || bookingInProgress}
              onClick={handleBookSession}
              whileHover={selectedDate && selectedTime ? { scale: 1.02 } : {}}
              whileTap={selectedDate && selectedTime ? { scale: 0.98 } : {}}
            >
              {bookingInProgress ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Booking Session...
                </span>
              ) : (
                'Book Session'
              )}
            </motion.button>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h2 className="font-heading text-xl font-semibold text-neutral-darkest mb-4">Reviews & Testimonials</h2>
            
            <div className="space-y-4">
              {/* Sample reviews - in a real app, these would come from the API */}
              <div className="border-b border-neutral-light pb-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-light mr-3"></div>
                  <div>
                    <div className="font-medium">Maria L.</div>
                    <div className="text-accent text-sm">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                  </div>
                  <div className="text-xs text-neutral ml-auto">2 weeks ago</div>
                </div>
                <p className="text-neutral-dark text-sm">
                  My session with {advisor.name} was truly transformative. Their insights provided clarity on issues I've been struggling with for months. Highly recommended!
                </p>
              </div>
              
              <div className="border-b border-neutral-light pb-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-light mr-3"></div>
                  <div>
                    <div className="font-medium">James T.</div>
                    <div className="text-accent text-sm">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="far fa-star"></i>
                    </div>
                  </div>
                  <div className="text-xs text-neutral ml-auto">1 month ago</div>
                </div>
                <p className="text-neutral-dark text-sm">
                  {advisor.name} has an amazing ability to connect with the spiritual realm. The guidance I received was spot on and helped me make an important life decision.
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-light mr-3"></div>
                  <div>
                    <div className="font-medium">Sophia R.</div>
                    <div className="text-accent text-sm">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                  </div>
                  <div className="text-xs text-neutral ml-auto">2 months ago</div>
                </div>
                <p className="text-neutral-dark text-sm">
                  I was skeptical at first, but {advisor.name} quickly put me at ease with their warm and understanding approach. The reading was accurate and gave me hope for the future.
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-primary hover:text-primary-dark font-medium">
                View All Reviews
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvisorProfile;
