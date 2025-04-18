import React from 'react';
import { Link } from 'wouter';
import { User, Specialty, SessionType } from '@shared/schema';
import { motion } from 'framer-motion';
import { MessageCircle, PhoneCall, Video } from 'lucide-react';

interface AdvisorCardProps {
  advisor: User;
  specialties?: Specialty[];
}

const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, specialties = [] }) => {
  // Helper function to generate star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`star-${i}`} className="fas fa-star"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half-star" className="fas fa-star-half-alt"></i>);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
    }
    
    return stars;
  };
  
  // Determine advisor status badge
  const getAdvisorBadge = () => {
    if (advisor.reviewCount && advisor.reviewCount > 200) {
      return {
        text: "Top Rated",
        bgColor: "bg-purple-600"
      };
    } else if (advisor.reviewCount && advisor.reviewCount > 100) {
      return {
        text: "Very Popular",
        bgColor: "bg-indigo-600"
      };
    } else if (advisor.reviewCount && advisor.reviewCount > 50) {
      return {
        text: "Rising Talent",
        bgColor: "bg-blue-600"
      };
    } else {
      return {
        text: "Newly Joined",
        bgColor: "bg-teal-600"
      };
    }
  };
  
  const badge = getAdvisorBadge();
  const mainSpecialty = specialties.length > 0 ? specialties[0].name : 'Spiritual Reading';
  
  return (
    <motion.div 
      className="advisor-card bg-white border border-gray-200 rounded-lg overflow-hidden transition duration-300"
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(123, 104, 238, 0.15)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <div className="relative h-64 w-full">
          <img 
            src={advisor.avatar || "https://via.placeholder.com/300x300"} 
            alt={`${advisor.name}, Spiritual Advisor`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
          <div className="absolute bottom-2 left-2 right-2 text-white font-bold text-lg">
            {advisor.name}
            <div className={`text-sm text-white/90 ${advisor.online ? 'text-green-400' : ''}`}>
              {advisor.online ? 'online' : 'offline'}
            </div>
          </div>
        </div>
        
        <div className={`absolute top-2 left-0 ${badge.bgColor} text-white text-xs font-bold py-1 px-2`}>
          <span>{badge.text}</span>
        </div>
        
        <div className="absolute top-10 left-0 bg-yellow-500 text-white text-xs font-bold py-1 px-2 flex items-center">
          <span className="mr-1">{advisor.rating?.toFixed(1) || '5.0'}</span>
          <div className="h-4 w-4 bg-purple-500 rounded-full"></div>
        </div>
        
        <div className="absolute top-18 left-0 bg-white/90 text-gray-800 text-xs py-1 px-2">
          <span>({advisor.reviewCount || 0} Reviews)</span>
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex flex-col mb-3">
          <h3 className="font-bold text-lg text-center mb-1">{advisor.name}</h3>
          <div className="text-center text-sm">
            <div className="text-gray-600 mb-1">Main Specialty</div>
            <div className="font-medium">{mainSpecialty}</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-center text-sm font-medium mb-2">Service Options:</div>
          <div className="grid grid-cols-3 gap-2">
            <Link href={`/advisors/${advisor.id}?type=${SessionType.CHAT}`}>
              <a className="flex flex-col items-center bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-1 rounded transition duration-200">
                <MessageCircle size={18} className="mb-1" />
                <div className="text-xs">Chat</div>
                <div className="text-xs font-bold">${(advisor.chatRate ? advisor.chatRate / 100 : 1.50).toFixed(2)}/min</div>
              </a>
            </Link>
            <Link href={`/advisors/${advisor.id}?type=${SessionType.AUDIO}`}>
              <a className="flex flex-col items-center bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-1 rounded transition duration-200">
                <PhoneCall size={18} className="mb-1" />
                <div className="text-xs">Audio</div>
                <div className="text-xs font-bold">${(advisor.audioRate ? advisor.audioRate / 100 : 2.00).toFixed(2)}/min</div>
              </a>
            </Link>
            <Link href={`/advisors/${advisor.id}?type=${SessionType.VIDEO}`}>
              <a className="flex flex-col items-center bg-pink-600 hover:bg-pink-700 text-white text-center py-2 px-1 rounded transition duration-200">
                <Video size={18} className="mb-1" />
                <div className="text-xs">Video</div>
                <div className="text-xs font-bold">${(advisor.videoRate ? advisor.videoRate / 100 : 2.50).toFixed(2)}/min</div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvisorCard;
