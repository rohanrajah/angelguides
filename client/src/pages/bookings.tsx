import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Session } from '@shared/schema';
import SessionCard from '@/components/session/SessionCard';
import { Link } from 'wouter';
import { format } from 'date-fns';

const Bookings: React.FC = () => {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  
  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  // Fetch user's sessions
  const { data: sessions = [], isLoading } = useQuery<(Session & { advisor?: User })[]>({
    queryKey: [`/api/users/${currentUser?.id || 5}/sessions`],
    enabled: !!currentUser,
  });
  
  // Filter sessions based on current filter
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return sessionDate > now;
    } else if (filter === 'past') {
      return sessionDate < now;
    } else {
      return true;
    }
  });
  
  // Group sessions by date (for better organization)
  const groupedSessions: { [key: string]: (Session & { advisor?: User })[] } = {};
  filteredSessions.forEach(session => {
    const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd');
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = [];
    }
    groupedSessions[dateKey].push(session);
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-heading text-3xl font-semibold text-primary">Your Sessions</h1>
          <Link href="/advisors">
            <motion.a 
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition duration-200 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-plus mr-2"></i>
              <span>Book New Session</span>
            </motion.a>
          </Link>
        </div>
        
        {/* Filter tabs */}
        <div className="flex border-b border-neutral-light mb-6">
          <motion.button 
            className={`py-2 px-4 font-medium ${filter === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
            onClick={() => setFilter('upcoming')}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            Upcoming
          </motion.button>
          <motion.button 
            className={`py-2 px-4 font-medium ${filter === 'past' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
            onClick={() => setFilter('past')}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            Past
          </motion.button>
          <motion.button 
            className={`py-2 px-4 font-medium ${filter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-neutral-dark hover:text-primary'}`}
            onClick={() => setFilter('all')}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            All Sessions
          </motion.button>
        </div>
        
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden mb-4 animate-pulse">
                <div className="p-4 h-24"></div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedSessions).length > 0 ? (
          // Sessions list grouped by date
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
              <div key={dateKey}>
                <h2 className="font-heading text-xl font-medium text-neutral-darkest mb-3">
                  {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="space-y-4">
                  {dateSessions.map(session => (
                    <SessionCard 
                      key={session.id}
                      session={session}
                      advisor={session.advisor}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="bg-white rounded-xl shadow-soft p-8 text-center">
            <div className="text-neutral mb-4">
              <i className="far fa-calendar-check text-5xl"></i>
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-2">No {filter} Sessions</h2>
            <p className="text-neutral-dark mb-6">
              {filter === 'upcoming' 
                ? "You don't have any upcoming sessions scheduled." 
                : filter === 'past' 
                  ? "You haven't completed any sessions yet."
                  : "You don't have any sessions in your history."}
            </p>
            <Link href="/advisors">
              <motion.a 
                className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-md transition duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Find an Advisor
              </motion.a>
            </Link>
          </div>
        )}
      </motion.div>
      
      {/* Tips and reminders section */}
      {filter === 'upcoming' && filteredSessions.length > 0 && (
        <div className="mt-8 bg-primary/10 rounded-xl p-6">
          <h3 className="font-heading text-lg font-semibold text-neutral-darkest mb-3">
            <i className="fas fa-lightbulb text-primary mr-2"></i>
            Tips for a Great Session
          </h3>
          <ul className="space-y-2 text-neutral-dark">
            <li className="flex items-start">
              <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
              <span>Find a quiet, comfortable space where you won't be disturbed</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
              <span>Have your questions or topics ready to make the most of your time</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
              <span>Test your camera and microphone before the session begins</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
              <span>Approach your session with an open mind and heart</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Bookings;
