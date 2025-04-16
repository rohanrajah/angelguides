import React from 'react';
import { Specialty } from '@shared/schema';
import { motion } from 'framer-motion';

interface AdvisorFiltersProps {
  specialties: Specialty[];
  activeSpecialty: number | null;
  setActiveSpecialty: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AdvisorFilters: React.FC<AdvisorFiltersProps> = ({
  specialties,
  activeSpecialty,
  setActiveSpecialty,
  searchQuery,
  setSearchQuery
}) => {
  // Map specialty icons to Font Awesome classes
  const getIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      'cards': 'fas fa-cards',
      'moon': 'fas fa-moon',
      'spa': 'fas fa-spa',
      'hands': 'fas fa-hands',
      'crystal-ball': 'fas fa-atom'
    };
    
    return iconMap[icon] || 'fas fa-star';
  };
  
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold text-neutral-darkest">Discover Advisors</h2>
        <div className="flex items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search advisors..." 
              className="pl-10 pr-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral"></i>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-5">
        <motion.button 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition duration-200 ${
            activeSpecialty === null 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-white border border-neutral-light text-neutral-dark hover:bg-neutral-lightest hover:text-primary'
          }`}
          onClick={() => setActiveSpecialty(null)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className="fas fa-star mr-1"></i>
          <span>All</span>
        </motion.button>
        
        {specialties.map(specialty => (
          <motion.button 
            key={specialty.id}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition duration-200 ${
              activeSpecialty === specialty.id 
                ? 'bg-primary text-white hover:bg-primary-dark' 
                : 'bg-white border border-neutral-light text-neutral-dark hover:bg-neutral-lightest hover:text-primary'
            }`}
            onClick={() => setActiveSpecialty(specialty.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`${getIcon(specialty.icon)} mr-1`}></i>
            <span>{specialty.name}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default AdvisorFilters;
