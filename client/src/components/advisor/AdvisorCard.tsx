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
  
  return (
    <motion.div 
      className="advisor-card bg-white rounded-xl shadow-soft overflow-hidden transition duration-300"
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(123, 104, 238, 0.15)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img 
          src={advisor.avatar || "https://via.placeholder.com/600x300"} 
          alt={`${advisor.name}, Spiritual Advisor`} 
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-3 right-3 ${advisor.online ? 'bg-success' : 'bg-neutral'} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
          <i className={`${advisor.online ? 'fas' : 'far'} fa-circle text-xs mr-1`}></i>
          {advisor.online ? 'Online' : 'Away'}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="flex items-center mb-1">
            <span className="text-accent">
              {renderStars(advisor.rating || 0)}
            </span>
            <span className="ml-2 text-sm">{advisor.rating?.toFixed(1) || '0.0'} ({advisor.reviewCount || 0} reviews)</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-heading text-lg font-semibold text-neutral-darkest">{advisor.name}</h3>
            <p className="text-primary text-sm font-medium">
              {specialties.length > 0 
                ? `${specialties[0]?.name} ${specialties.length > 1 ? '& More' : ''}`
                : 'Spiritual Advisor'
              }
            </p>
          </div>
          <span className="bg-neutral-lightest text-primary text-sm px-2 py-1 rounded-md">
            ${advisor.hourlyRate || 0}/session
          </span>
        </div>
        <p className="text-neutral-dark text-sm mb-3 line-clamp-2">{advisor.bio || 'A skilled spiritual advisor ready to guide you on your journey.'}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {specialties.map(specialty => (
            <span key={specialty.id} className="text-xs bg-neutral-lightest text-neutral-dark px-2 py-0.5 rounded-full">
              {specialty.name}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral">
            <i className="far fa-calendar-alt mr-1"></i>
            {advisor.availability || 'Available today'}
          </span>
          <Link href={`/advisors/${advisor.id}`}>
            <a className="bg-primary hover:bg-primary-dark text-white text-sm rounded-md px-3 py-1.5 transition duration-200">
              Book Session
            </a>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvisorCard;
