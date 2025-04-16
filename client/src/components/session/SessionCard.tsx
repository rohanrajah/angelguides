import React from 'react';
import { Session, User } from '@shared/schema';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface SessionCardProps {
  session: Session;
  advisor: User | undefined;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, advisor }) => {
  if (!advisor) return null;
  
  const isUpcoming = new Date(session.startTime) > new Date();
  const sessionDate = new Date(session.startTime);
  const startTime = format(sessionDate, 'h:mm a');
  const endTime = format(new Date(session.endTime), 'h:mm a');
  
  // Calculate session length in minutes
  const duration = Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60));
  
  // Format date based on how soon it is
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  let dateDisplay = format(sessionDate, 'EEEE, MMM d');
  if (sessionDate.getTime() === today.getTime()) {
    dateDisplay = 'Today';
  } else if (sessionDate.getTime() === tomorrow.getTime()) {
    dateDisplay = 'Tomorrow';
  }
  
  return (
    <div className={`bg-white rounded-xl shadow-soft overflow-hidden mb-4 ${isUpcoming ? 'border-l-4 border-primary' : 'border-l-4 border-secondary'}`}>
      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0">
              <img 
                src={advisor.avatar || "https://via.placeholder.com/150"} 
                alt={advisor.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-neutral-darkest">
                Session with {advisor.name}
              </h3>
              <p className="text-neutral-dark text-sm">
                <i className="far fa-clock mr-1"></i>
                {dateDisplay}, {startTime} - {endTime} ({duration} min)
              </p>
              {session.notes && (
                <p className="text-neutral text-xs mt-1">
                  <i className="far fa-sticky-note mr-1"></i>
                  {session.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <motion.button 
              className="bg-white hover:bg-neutral-lightest text-neutral-dark border border-neutral-light rounded-md px-3 py-1.5 text-sm transition duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-pen mr-1"></i>
              <span>Reschedule</span>
            </motion.button>
            
            {isUpcoming ? (
              <motion.button 
                className="bg-primary hover:bg-primary-dark text-white rounded-md px-3 py-1.5 text-sm transition duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-video mr-1"></i>
                <span>Join</span>
              </motion.button>
            ) : (
              <motion.button 
                className="bg-neutral-light text-neutral-dark rounded-md px-3 py-1.5 text-sm cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
              >
                <i className="fas fa-video mr-1"></i>
                <span>Join</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
