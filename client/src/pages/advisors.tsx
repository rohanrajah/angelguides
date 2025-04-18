import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Specialty } from '@shared/schema';
import AdvisorCard from '@/components/advisor/AdvisorCard';
import AdvisorFilters from '@/components/advisor/AdvisorFilters';
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Advisors: React.FC = () => {
  const [activeSpecialty, setActiveSpecialty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const advisorsPerPage = 9;
  const [recommendedAdvisors, setRecommendedAdvisors] = useState<number[]>([]);
  
  // Check for recommended advisors on mount
  useEffect(() => {
    const recommendedAdvisorsStr = localStorage.getItem('recommendedAdvisors');
    if (recommendedAdvisorsStr) {
      try {
        const advisorIds = JSON.parse(recommendedAdvisorsStr);
        setRecommendedAdvisors(advisorIds);
      } catch (e) {
        console.error('Error parsing recommended advisors', e);
      }
    }
  }, []);
  
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
  
  // Pagination logic
  const indexOfLastAdvisor = currentPage * advisorsPerPage;
  const indexOfFirstAdvisor = indexOfLastAdvisor - advisorsPerPage;
  const currentAdvisors = filteredAdvisors.slice(indexOfFirstAdvisor, indexOfLastAdvisor);
  const totalPages = Math.ceil(filteredAdvisors.length / advisorsPerPage);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const WhyChooseUsSection = () => (
    <div className="bg-white rounded-lg p-6 my-8 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-purple-800 mb-6">Why Angel Guides?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-magic text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Easy to Start</h3>
          <p className="text-gray-600">
            Signing up is quick and easy, giving you access to the best psychics in the world.
            Within minutes, you can be discovering your destiny!
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-star text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Best Online Psychics</h3>
          <p className="text-gray-600">
            Tested and experienced psychic advisors are waiting to give their insight, day or night. 
            With dozens of psychics available, you can choose the one that is right for you.
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-heart text-purple-600 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">People Trust Us</h3>
          <p className="text-gray-600">
            All of our reviews are transparent and come from authentic clients just like you.
            Honesty is important to us and we hold our advisors to the highest standard of integrity.
          </p>
        </div>
      </div>
    </div>
  );
  
  const CustomerReviews = () => (
    <div className="bg-white rounded-lg p-6 my-8 border border-gray-200">
      <h2 className="text-xl font-bold text-center text-purple-800 mb-6">Recent Customer Reviews</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((_, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start mb-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
              <div>
                <div className="font-semibold">J. Smith</div>
                <div className="text-yellow-500 text-sm">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              "Amazing reading! Very accurate and insightful. Will definitely consult with this advisor again."
            </p>
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-center">Psychics & Spiritual Advisors Online</h1>
          <p className="text-center text-xl font-medium mb-2">
            {filteredAdvisors.length} Available Psychics
          </p>
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              className="w-full px-4 py-3 rounded-lg text-gray-800 border-0 focus:ring-2 focus:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Recommended advisors banner */}
        {recommendedAdvisors.length > 0 && (
          <Alert className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
            <div className="flex items-center">
              <div className="bg-purple-600 rounded-full p-2 mr-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
                </svg>
              </div>
              <AlertTitle className="text-purple-800 font-bold text-lg">Your Perfect Advisor Matches</AlertTitle>
            </div>
            <AlertDescription className="mt-2 text-purple-800">
              <p>Based on your answers, Angela has found {recommendedAdvisors.length} advisors who are perfect for your spiritual needs!</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recommendedAdvisors.map(id => {
                  const advisor = advisors.find(a => a.id === id);
                  if (!advisor) return null;
                  return (
                    <div 
                      key={id}
                      className="inline-flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-purple-200"
                    >
                      <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs">
                        {advisor.name.charAt(0)}
                      </span>
                      <span className="font-medium text-purple-900">{advisor.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-right">
                <button 
                  onClick={() => {
                    localStorage.removeItem('recommendedAdvisors');
                    setRecommendedAdvisors([]);
                  }}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {advisorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden animate-pulse border border-gray-200">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mb-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAdvisors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentAdvisors.map(advisor => (
                <AdvisorCard 
                  key={advisor.id} 
                  advisor={advisor} 
                  specialties={specialties.slice(0, 2)} // For demo, assign first two specialties
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-1">
                  <button 
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`px-4 py-2 border rounded-md ${
                        currentPage === i + 1 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center mt-6 border border-gray-200">
            <div className="text-gray-500 mb-2">
              <i className="fas fa-search text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No Advisors Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any advisors matching your search criteria. Try adjusting your filters.
            </p>
            <button 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white rounded-md px-4 py-2 transition duration-200"
              onClick={() => {
                setActiveSpecialty(null);
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
        
        <WhyChooseUsSection />
        <CustomerReviews />
        
        <div className="bg-white rounded-lg p-6 my-8 border border-gray-200">
          <h2 className="text-xl font-bold text-center text-purple-800 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-lg mb-2">How Will A Psychic Reading Help Me?</h3>
              <p className="text-gray-600">
                If you have a burning problem and need clarity or insight on something which is troubling you,
                one of our exceptional team will be able to put things into perspective for you and provide a
                peek into the future.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-lg mb-2">What Types of Readings Can I Choose From?</h3>
              <p className="text-gray-600">
                Our hand-picked psychics use different tools such as Tarot Cards, Crystal Balls, or many can
                work without tools. Types of readings include love, career, finance, spirituality, and connecting
                with passed loved ones.
              </p>
            </div>
            
            <div className="pb-4">
              <h3 className="font-semibold text-lg mb-2">I'm Nervous About What I Might Hear</h3>
              <p className="text-gray-600">
                Don't be anxious! Our psychics are selected not only for their abilities but also for their
                ethical approach. They aim to uplift, inspire and provide guidance that helps you move forward
                confidently.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Advisors;
