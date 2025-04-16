import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Specialty } from '@shared/schema';
import AdvisorCard from '@/components/advisor/AdvisorCard';
import AdvisorFilters from '@/components/advisor/AdvisorFilters';
import { motion } from 'framer-motion';

const Advisors: React.FC = () => {
  const [activeSpecialty, setActiveSpecialty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch all specialties
  const { data: specialties = [], isLoading: specialtiesLoading } = useQuery<Specialty[]>({
    queryKey: ['/api/specialties'],
  });
  
  // Fetch all advisors
  const { data: advisors = [], isLoading: advisorsLoading } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // Filter advisors based on selected specialty and search query
  const filteredAdvisors = advisors.filter(advisor => {
    const matchesSpecialty = activeSpecialty === null || true; // TODO: Filter by specialty when API is ready
    const matchesSearch = !searchQuery || 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.bio && advisor.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSpecialty && matchesSearch;
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl font-semibold text-primary mb-6">Find Your Spiritual Advisor</h1>
        
        <AdvisorFilters 
          specialties={specialties}
          activeSpecialty={activeSpecialty}
          setActiveSpecialty={setActiveSpecialty}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {advisorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse">
                <div className="h-48 bg-neutral-light"></div>
                <div className="p-4">
                  <div className="h-6 bg-neutral-light rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-neutral-light rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-neutral-light rounded w-full mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-neutral-light rounded w-1/3"></div>
                    <div className="h-8 bg-neutral-light rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAdvisors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredAdvisors.map(advisor => (
              <AdvisorCard 
                key={advisor.id} 
                advisor={advisor} 
                specialties={[]} // TODO: Add specialties when API is ready
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-soft p-6 text-center mt-6">
            <div className="text-neutral mb-2">
              <i className="fas fa-search text-3xl"></i>
            </div>
            <h3 className="font-heading text-lg font-medium mb-2">No Advisors Found</h3>
            <p className="text-neutral-dark text-sm mb-4">
              We couldn't find any advisors matching your search criteria. Try adjusting your filters.
            </p>
            <button 
              className="inline-block bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 transition duration-200"
              onClick={() => {
                setActiveSpecialty(null);
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Advisors;
