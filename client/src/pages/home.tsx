import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Session, Specialty } from '@shared/schema';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

// Components
import AdvisorCard from '@/components/advisor/AdvisorCard';
import AdvisorFilters from '@/components/advisor/AdvisorFilters';
import SessionCard from '@/components/session/SessionCard';
// Angela AI is now available as a floating bubble across all pages

const Home: React.FC = () => {
  const [activeSpecialty, setActiveSpecialty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  // Fetch all specialties
  const { data: specialties = [] } = useQuery<Specialty[]>({
    queryKey: ['/api/specialties'],
  });
  
  // Fetch all advisors
  const { data: advisors = [], isLoading: advisorsLoading } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // Fetch user's upcoming sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<(Session & { advisor?: User })[]>({
    queryKey: ['/api/users/5/sessions'],
    enabled: !!currentUser,
  });
  
  // Filter advisors based on selected specialty and search query
  const filteredAdvisors = advisors.filter(advisor => {
    const matchesSpecialty = activeSpecialty === null || true; // TODO: Filter by specialty when API is ready
    const matchesSearch = !searchQuery || 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.bio && advisor.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSpecialty && matchesSearch;
  }).slice(0, 4); // Only show 4 advisors on home page
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          {/* Welcome Section */}
          <motion.section 
            className="mb-8 rounded-xl shadow-soft bg-mystical p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundImage: "linear-gradient(to right, rgba(248, 247, 255, 0.95), rgba(230, 229, 240, 0.95)), url('https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-primary mb-3">
                  Welcome back, {currentUser?.name?.split(' ')[0] || 'Seeker'}
                </h2>
                <p className="text-neutral-dark mb-4">
                  Your spiritual journey continues. You have <span className="font-semibold text-primary">{sessions.length} upcoming sessions</span> this week.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/advisors">
                    <motion.a 
                      className="bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 transition duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-calendar-alt mr-2"></i>
                      <span>Book a Session</span>
                    </motion.a>
                  </Link>
                  <Link href="/advisors">
                    <motion.a 
                      className="bg-white hover:bg-neutral-lightest text-primary border border-primary rounded-md px-4 py-2 transition duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-search mr-2"></i>
                      <span>Find Advisor</span>
                    </motion.a>
                  </Link>
                </div>
              </div>
              <motion.div 
                className="mt-6 md:mt-0 w-32 h-32 flex-shrink-0"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1531171673193-41b4691e1184?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
                  alt="Spiritual elements" 
                  className="w-full h-full object-contain rounded-full shadow-glow"
                />
              </motion.div>
            </div>
          </motion.section>

          {/* Category Filters */}
          <AdvisorFilters 
            specialties={specialties}
            activeSpecialty={activeSpecialty}
            setActiveSpecialty={setActiveSpecialty}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Advisors List */}
          <section className="mb-10">
            {advisorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((_, index) => (
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
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAdvisors.map(advisor => (
                    <AdvisorCard 
                      key={advisor.id} 
                      advisor={advisor} 
                      specialties={[]} // TODO: Add specialties when API is ready
                    />
                  ))}
                </div>
                
                <div className="flex justify-center mt-8">
                  <Link href="/advisors">
                    <motion.a 
                      className="bg-white hover:bg-neutral-lightest text-primary font-medium border border-primary rounded-md px-6 py-2 transition duration-200 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>View More Advisors</span>
                      <i className="fas fa-chevron-down ml-2"></i>
                    </motion.a>
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* Upcoming Sessions Section */}
          <section className="mb-8">
            <h2 className="font-heading text-xl font-semibold text-neutral-darkest mb-4">Your Upcoming Sessions</h2>
            
            {sessionsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden mb-4 animate-pulse">
                    <div className="p-4 h-24"></div>
                  </div>
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div>
                {sessions.map(session => (
                  <SessionCard 
                    key={session.id}
                    session={session}
                    advisor={session.advisor}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft p-6 text-center">
                <div className="text-neutral mb-2">
                  <i className="far fa-calendar-alt text-3xl"></i>
                </div>
                <h3 className="font-heading text-lg font-medium mb-2">No Upcoming Sessions</h3>
                <p className="text-neutral-dark text-sm mb-4">You don't have any upcoming sessions scheduled yet.</p>
                <Link href="/advisors">
                  <a className="inline-block bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 transition duration-200">
                    Book a Session
                  </a>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          {/* Enterprise Features */}
          <div className="bg-white rounded-xl shadow-soft mb-6">
            <div className="p-4 border-b border-neutral-light">
              <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Spiritual Resources</h2>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <i className="fas fa-book"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-darkest">Meditation Guides</h4>
                    <p className="text-sm text-neutral-dark">Free guided meditations</p>
                  </div>
                  <button className="ml-auto text-primary hover:text-primary-dark">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <i className="fas fa-star"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-darkest">Tarot Meanings</h4>
                    <p className="text-sm text-neutral-dark">Learn tarot card interpretations</p>
                  </div>
                  <button className="ml-auto text-primary hover:text-primary-dark">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <i className="fas fa-moon"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-darkest">Astrological Calendar</h4>
                    <p className="text-sm text-neutral-dark">Upcoming celestial events</p>
                  </div>
                  <button className="ml-auto text-primary hover:text-primary-dark">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <i className="fas fa-gem"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-darkest">Crystal Guide</h4>
                    <p className="text-sm text-neutral-dark">Properties and uses of crystals</p>
                  </div>
                  <button className="ml-auto text-primary hover:text-primary-dark">
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </li>
              </ul>
              <button className="w-full mt-4 bg-neutral-lightest hover:bg-neutral-light text-neutral-dark rounded-md py-2 transition duration-200 text-sm font-medium">
                Explore All Resources
              </button>
            </div>
          </div>
          
          {/* Spiritual Growth Tracker */}
          <div className="bg-white rounded-xl shadow-soft">
            <div className="p-4 border-b border-neutral-light">
              <h2 className="font-heading text-lg font-semibold text-neutral-darkest">Your Spiritual Journey</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-dark">Sessions Completed</span>
                    <span className="text-sm font-medium text-primary">42%</span>
                  </div>
                  <div className="w-full bg-neutral-light rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <p className="text-xs text-neutral mt-1">21 of 50 recommended sessions</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-dark">Meditation Practice</span>
                    <span className="text-sm font-medium text-secondary">65%</span>
                  </div>
                  <div className="w-full bg-neutral-light rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-neutral mt-1">13 hours of 20 hour goal</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-neutral-dark">Spiritual Growth</span>
                    <span className="text-sm font-medium text-accent">78%</span>
                  </div>
                  <div className="w-full bg-neutral-light rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="text-xs text-neutral mt-1">Based on advisor assessments</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-neutral-lightest rounded-lg">
                <h4 className="text-sm font-medium text-neutral-darkest mb-2">Most Beneficial Practices</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-dark">Daily Meditation</span>
                    <span className="text-xs font-medium text-neutral-darkest">High Impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-dark">Tarot Reflection</span>
                    <span className="text-xs font-medium text-neutral-darkest">Medium Impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-dark">Energy Healing</span>
                    <span className="text-xs font-medium text-neutral-darkest">High Impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-dark">Astrological Planning</span>
                    <span className="text-xs font-medium text-neutral-darkest">Medium Impact</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-primary hover:bg-primary-dark text-white rounded-md py-2 transition duration-200 text-sm font-medium">
                View Full Journey Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
