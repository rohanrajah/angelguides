import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { User, Specialty, Session, SessionType, Review } from '@shared/schema';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, PhoneCall, Video, StarIcon } from 'lucide-react';
import { ReviewDisplay, ReviewForm, RatingSummary } from '@/components/reviews';

const AdvisorProfile: React.FC = () => {
  const [match, params] = useRoute<{ id: string }>('/advisors/:id');
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<SessionType>(SessionType.CHAT);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // Generate available times for demo purposes
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
  
  // Check for service type in URL
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type');
    if (typeParam && Object.values(SessionType).includes(typeParam as SessionType)) {
      setSelectedServiceType(typeParam as SessionType);
    }
  }, []);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };
  
  // Helper function to get rate based on selected service type
  const getSelectedRate = (): number => {
    if (!advisor) return 0;
    
    switch (selectedServiceType) {
      case SessionType.CHAT:
        return advisor.chatRate ? advisor.chatRate / 100 : 1.50;
      case SessionType.AUDIO:
        return advisor.audioRate ? advisor.audioRate / 100 : 2.00; 
      case SessionType.VIDEO:
        return advisor.videoRate ? advisor.videoRate / 100 : 2.50;
      default:
        return advisor.chatRate ? advisor.chatRate / 100 : 1.50;
    }
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
      
      // Get appropriate rate for the service type
      const ratePerMinute = getSelectedRate();
      
      // Send API request to book session
      await apiRequest('POST', '/api/sessions', {
        userId: currentUser.id,
        advisorId: advisor.id,
        startTime,
        endTime,
        sessionType: selectedServiceType,
        ratePerMinute,
        notes: `${selectedServiceType} session with ${advisor.name}`
      });
      
      // Show success message
      toast({
        title: `${selectedServiceType} Session Booked`,
        description: `Your ${selectedServiceType.toLowerCase()} session with ${advisor.name} has been scheduled for ${format(startTime, 'MMM d, yyyy')} at ${format(startTime, 'h:mm a')}.`,
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
        <div className="flex flex-col gap-8 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="md:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!advisor) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-gray-500 mb-4">
            <i className="fas fa-user-slash text-4xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-4">Advisor Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the advisor you're looking for. They may no longer be available.
          </p>
          <Link href="/advisors">
            <a className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition duration-200">
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
        {/* Header section with advisor name and rating */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/4 mb-4 md:mb-0">
              <div className="relative w-40 h-40 mx-auto">
                <img 
                  src={advisor.avatar || "https://via.placeholder.com/300x300"} 
                  alt={advisor.name}
                  className="w-full h-full object-cover rounded-full border-4 border-white"
                />
                <div className={`absolute bottom-2 right-2 ${advisor.online ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                  {advisor.online ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
            
            <div className="md:w-3/4 text-center md:text-left md:pl-6">
              <h1 className="text-3xl font-bold mb-2">{advisor.name}</h1>
              
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="text-yellow-400 text-lg mr-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <i key={i} className={`${i <= Math.floor(advisor.rating || 0) ? 'fas' : i - 0.5 === advisor.rating ? 'fas fa-star-half-alt' : 'far'} fa-star`}></i>
                  ))}
                </div>
                <span className="text-white/90">{advisor.rating?.toFixed(1)} ({advisor.reviewCount} reviews)</span>
              </div>
              
              <p className="text-white/80 mb-4 max-w-2xl">
                {advisor.bio?.substring(0, 150)}...
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {advisor.specialties?.map(specialty => (
                  <span key={specialty.id} className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                    {specialty.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - About and details */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="bg-purple-100 p-4 border-b border-gray-200">
                <h2 className="font-bold text-xl text-purple-800">About {advisor.name}</h2>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 mb-4">{advisor.bio}</p>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {advisor.specialties?.map(specialty => (
                      <span key={specialty.id} className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                        {specialty.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Availability</h3>
                  <p className="text-gray-700">
                    <i className="far fa-clock mr-2"></i>
                    {advisor.availability || 'Available most days, 9:00 AM - 9:00 PM EST'}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Service Rates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <MessageCircle size={16} className="mr-2" />
                        <span>Chat</span>
                      </span>
                      <span className="font-semibold text-purple-600">
                        ${(advisor.chatRate ? advisor.chatRate / 100 : 1.50).toFixed(2)}/min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <PhoneCall size={16} className="mr-2" />
                        <span>Audio</span>
                      </span>
                      <span className="font-semibold text-purple-600">
                        ${(advisor.audioRate ? advisor.audioRate / 100 : 2.00).toFixed(2)}/min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Video size={16} className="mr-2" />
                        <span>Video</span>
                      </span>
                      <span className="font-semibold text-purple-600">
                        ${(advisor.videoRate ? advisor.videoRate / 100 : 2.50).toFixed(2)}/min
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Billed per minute. Average session: 30-60 minutes
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-purple-100 p-4 border-b border-gray-200">
                <h2 className="font-bold text-xl text-purple-800">Connect via</h2>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    className={`w-full py-3 rounded-md font-medium transition flex items-center justify-center
                      ${selectedServiceType === SessionType.VIDEO 
                        ? 'bg-pink-700 text-white' 
                        : 'bg-pink-600 hover:bg-pink-700 text-white'}`}
                    onClick={() => setSelectedServiceType(SessionType.VIDEO)}
                  >
                    <Video className="mr-2" size={18} /> Video Call
                    <span className="ml-auto">${(advisor.videoRate ? advisor.videoRate / 100 : 2.50).toFixed(2)}/min</span>
                  </button>
                  <button 
                    className={`w-full py-3 rounded-md font-medium transition flex items-center justify-center
                      ${selectedServiceType === SessionType.AUDIO 
                        ? 'bg-purple-700 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    onClick={() => setSelectedServiceType(SessionType.AUDIO)}
                  >
                    <PhoneCall className="mr-2" size={18} /> Audio Call
                    <span className="ml-auto">${(advisor.audioRate ? advisor.audioRate / 100 : 2.00).toFixed(2)}/min</span>
                  </button>
                  <button 
                    className={`w-full py-3 rounded-md font-medium transition flex items-center justify-center
                      ${selectedServiceType === SessionType.CHAT 
                        ? 'bg-indigo-700 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    onClick={() => setSelectedServiceType(SessionType.CHAT)}
                  >
                    <MessageCircle className="mr-2" size={18} /> Chat Session
                    <span className="ml-auto">${(advisor.chatRate ? advisor.chatRate / 100 : 1.50).toFixed(2)}/min</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Booking and reviews */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="bg-purple-100 p-4 border-b border-gray-200">
                <h2 className="font-bold text-xl text-purple-800">Book a Session</h2>
              </div>
              
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">1. Select a Date</h3>
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
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
                  <h3 className="font-medium text-gray-700 mb-3">2. Select a Time</h3>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2">
                      {availableTimes.map(time => {
                        const isSelected = time === selectedTime;
                        const [hour, minute] = time.split(':').map(Number);
                        const timeObj = new Date();
                        timeObj.setHours(hour, minute, 0, 0);
                        
                        return (
                          <motion.button 
                            key={time}
                            className={`py-2 px-3 rounded-md text-center ${
                              isSelected 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
                    <p className="text-gray-500 italic">No available times on this date.</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Session Summary</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Advisor:</span>
                    <span className="font-medium">{advisor.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="flex items-center font-medium">
                      {selectedServiceType === SessionType.CHAT && <MessageCircle size={16} className="mr-1" />}
                      {selectedServiceType === SessionType.AUDIO && <PhoneCall size={16} className="mr-1" />}
                      {selectedServiceType === SessionType.VIDEO && <Video size={16} className="mr-1" />}
                      {selectedServiceType === SessionType.CHAT ? 'Chat' : 
                       selectedServiceType === SessionType.AUDIO ? 'Audio Call' : 'Video Call'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Time:</span>
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
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">30 minutes</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">${getSelectedRate().toFixed(2)}/minute</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg mt-4 pt-4 border-t border-gray-200">
                    <span>Total (estimated):</span>
                    <span className="text-purple-600">${(getSelectedRate() * 30).toFixed(2)}</span>
                  </div>
                </div>
                
                <motion.button 
                  className={`w-full py-3 rounded-md font-semibold text-white ${
                    selectedDate && selectedTime 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!selectedDate || !selectedTime || bookingInProgress}
                  onClick={handleBookSession}
                  whileHover={selectedDate && selectedTime ? { scale: 1.02 } : {}}
                  whileTap={selectedDate && selectedTime ? { scale: 0.98 } : {}}
                >
                  {bookingInProgress ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </span>
                  ) : (
                    'Book Now'
                  )}
                </motion.button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-purple-100 p-4 border-b border-gray-200">
                <h2 className="font-bold text-xl text-purple-800">Client Reviews</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {/* Sample reviews - in a real app, these would come from the API */}
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                      <div>
                        <div className="font-medium">Maria L.</div>
                        <div className="text-yellow-500 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-auto">2 weeks ago</div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      My session with {advisor.name} was truly transformative. Their insights provided clarity on issues I've been struggling with for months. Highly recommended!
                    </p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                      <div>
                        <div className="font-medium">James T.</div>
                        <div className="text-yellow-500 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="far fa-star"></i>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-auto">1 month ago</div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {advisor.name} has an amazing ability to connect with the spiritual realm. The guidance I received was spot on and helped me make an important life decision.
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                      <div>
                        <div className="font-medium">Sophia R.</div>
                        <div className="text-yellow-500 text-sm">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-auto">2 months ago</div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      I was skeptical at first, but my reading with {advisor.name} blew me away. They knew things they couldn't possibly have known, and provided practical advice that has already improved my life.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <button className="text-purple-600 hover:text-purple-800 font-medium">
                    View All {advisor.reviewCount} Reviews
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvisorProfile;