import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Specialty, SpecialtyCategory } from '@shared/schema';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdvisorCard } from './AdvisorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  [SpecialtyCategory.DIVINATION]: 'Divination',
  [SpecialtyCategory.HEALING]: 'Healing',
  [SpecialtyCategory.SPIRITUAL_GUIDANCE]: 'Spiritual Guidance',
  [SpecialtyCategory.MEDIUM]: 'Mediumship',
  [SpecialtyCategory.ASTROLOGY]: 'Astrology',
  [SpecialtyCategory.DREAM_INTERPRETATION]: 'Dream Interpretation',
  [SpecialtyCategory.ENERGY_WORK]: 'Energy Work',
  [SpecialtyCategory.PAST_LIVES]: 'Past Lives',
  [SpecialtyCategory.CHANNELING]: 'Channeling',
  [SpecialtyCategory.GENERAL]: 'General'
};

const categoryDescriptions: Record<string, string> = {
  [SpecialtyCategory.DIVINATION]: 'Advisors specialized in tarot, pendulum, and other forms of divination to provide insight into your future.',
  [SpecialtyCategory.HEALING]: 'Healers who help with emotional, spiritual, and energetic healing through various modalities.',
  [SpecialtyCategory.SPIRITUAL_GUIDANCE]: 'Spiritual guides who help you find your path and purpose through meditation and guidance.',
  [SpecialtyCategory.MEDIUM]: 'Mediums who can connect with spirits and loved ones who have passed on.',
  [SpecialtyCategory.ASTROLOGY]: 'Astrologers who interpret celestial movements and their impact on your life journey.',
  [SpecialtyCategory.DREAM_INTERPRETATION]: 'Specialists who decode the symbolic language of your dreams and subconscious mind.',
  [SpecialtyCategory.ENERGY_WORK]: 'Energy workers who help balance and align your chakras and energy fields.',
  [SpecialtyCategory.PAST_LIVES]: 'Experts who can help you explore your past lives and their influence on your current existence.',
  [SpecialtyCategory.CHANNELING]: 'Channelers who connect with higher beings and dimensions to deliver messages and guidance.',
  [SpecialtyCategory.GENERAL]: 'Advisors with broad spiritual knowledge across multiple disciplines.'
};

interface AdvisorCategoryBrowserProps {
  preselectedCategory?: string;
  recommendedAdvisors?: number[];
}

const AdvisorCategoryBrowser: React.FC<AdvisorCategoryBrowserProps> = ({ 
  preselectedCategory, 
  recommendedAdvisors 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(
    preselectedCategory || SpecialtyCategory.DIVINATION
  );

  // Get categories
  const { data: allCategories } = useQuery<Specialty[], Error, string[]>({
    queryKey: ['/api/specialties'],
    select: (data) => {
      // Group by category
      const categories = new Set<string>();
      data.forEach((specialty) => {
        if (specialty.category) {
          categories.add(specialty.category);
        }
      });
      return Array.from(categories);
    }
  });

  // Get all advisors instead of filtering by category
  const { 
    data: advisors = [], 
    isLoading: isLoadingAdvisors,
    isError 
  } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // Randomly assign specialties to advisors for display purposes
  const specialtyIds = Array.from({ length: 15 }, (_, i) => i + 1);
  
  // Filter advisors based on active category (just for UI purposes)
  const filteredAdvisors = advisors.filter((_, index) => {
    // Show all advisors in all categories for now
    return true;
  });

  // Loading skeletons
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="pt-2 flex justify-between">
            <Skeleton className="h-8 w-[60px]" />
            <Skeleton className="h-8 w-[80px]" />
          </div>
        </div>
      ))}
    </div>
  );

  const availableCategories = allCategories || Object.values(SpecialtyCategory);

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap mb-6 h-auto">
          {availableCategories.map((category: string) => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="px-4 py-2 text-sm"
            >
              {categoryLabels[category] || category}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableCategories.map((category: string) => (
          <TabsContent key={category} value={category}>
            <div className="mb-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{categoryLabels[category] || category}</AlertTitle>
                <AlertDescription>
                  {categoryDescriptions[category] || `Advisors specialized in ${categoryLabels[category] || category}.`}
                </AlertDescription>
              </Alert>
            </div>

            {isLoadingAdvisors ? (
              renderSkeletons()
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  Error loading advisors. Please try again.
                </p>
              </div>
            ) : advisors.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  No advisors found in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advisors.map((advisor) => {
                  // Generate random specialties for each advisor (3-5 specialties per advisor)
                  const randomSpecialtyCount = Math.floor(Math.random() * 3) + 3; // 3-5 specialties
                  const shuffledSpecialties = [...specialtyIds].sort(() => 0.5 - Math.random());
                  const advisorSpecialties = shuffledSpecialties.slice(0, randomSpecialtyCount);
                  
                  // Create specialty objects with names for display
                  const specialtiesWithNames = advisorSpecialties.map(id => ({
                    id,
                    name: getRandomSpecialtyName(id),
                    icon: 'star'
                  }));
                  
                  return (
                    <AdvisorCard 
                      key={advisor.id} 
                      advisor={advisor}
                      specialties={specialtiesWithNames}
                      highlighted={recommendedAdvisors?.includes(advisor.id)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdvisorCategoryBrowser;