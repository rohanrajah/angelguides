import React from 'react';
import { Link } from 'wouter';
import { User, Specialty } from '@shared/schema';
import { motion } from 'framer-motion';

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
          <div className="text-center text-sm font-medium mb-2">Connect with me now:</div>
          <div className="grid grid-cols-1 gap-2">
            <Link href={`/advisors/${advisor.id}`}>
              <a className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded transition duration-200">
                ${advisor.minuteRate?.toFixed(2) || '1.99'}/min
              </a>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvisorCard;
