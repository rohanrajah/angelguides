import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VedicAstrologyChart from './VedicAstrologyChart';
import HumanDesignChart from './HumanDesignChart';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SpiritualProfileSectionProps {
  user: User;
  isEditable?: boolean;
}

const SpiritualProfileSection: React.FC<SpiritualProfileSectionProps> = ({ 
  user,
  isEditable = false 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for form values when editing
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    user.birthDate ? new Date(user.birthDate) : undefined
  );
  const [birthTime, setBirthTime] = useState<string>(user.birthTime || '');
  const [birthPlace, setBirthPlace] = useState<string>(user.birthPlace || '');
  const [isLoading, setIsLoading] = useState(false);

  // Generate sample chart data for UI display
  // In a real implementation, you would calculate these values based on birth information
  const generateSampleVedicChartData = () => {
    if (!user.vedicChart) {
      // Create a basic sample if no real data exists
      return {
        planets: [
          { name: 'Sun', symbol: '☉', angle: Math.random() * Math.PI * 2, distance: 0.4, color: '#FFB900' },
          { name: 'Moon', symbol: '☽', angle: Math.random() * Math.PI * 2, distance: 0.5, color: '#6B73FF' },
          { name: 'Mercury', symbol: '☿', angle: Math.random() * Math.PI * 2, distance: 0.6, color: '#0078D7' },
          { name: 'Venus', symbol: '♀', angle: Math.random() * Math.PI * 2, distance: 0.35, color: '#FF5CC0' },
          { name: 'Mars', symbol: '♂', angle: Math.random() * Math.PI * 2, distance: 0.55, color: '#E74856' },
          { name: 'Jupiter', symbol: '♃', angle: Math.random() * Math.PI * 2, distance: 0.45, color: '#8362F7' },
          { name: 'Saturn', symbol: '♄', angle: Math.random() * Math.PI * 2, distance: 0.65, color: '#4C535B' },
        ],
        elements: [
          { name: 'Sun', symbol: '☉', position: 'Aries' },
          { name: 'Moon', symbol: '☽', position: 'Taurus' },
          { name: 'Mercury', symbol: '☿', position: 'Gemini' },
          { name: 'Venus', symbol: '♀', position: 'Cancer' },
          { name: 'Mars', symbol: '♂', position: 'Leo' },
          { name: 'Jupiter', symbol: '♃', position: 'Virgo' },
          { name: 'Saturn', symbol: '♄', position: 'Libra' },
          { name: 'Ascendant', symbol: 'ASC', position: 'Scorpio' },
        ]
      };
    }
    return user.vedicChart;
  };

  const generateSampleHumanDesignData = () => {
    if (!user.humanDesignData) {
      // Create a basic sample if no real data exists
      return {
        type: 'Generator',
        strategy: 'Wait to respond',
        authority: 'Sacral',
        profile: '1/3',
        definition: 'Split',
        definedCenters: ['Sacral', 'Root', 'Throat'],
        definedChannels: ['Sacral-Root', 'Throat-G'],
        gates: [
          { number: 34, x: -30, y: 100 },
          { number: 20, x: 0, y: -80 },
          { number: 57, x: 0, y: 180 },
        ]
      };
    }
    return user.humanDesignData;
  };

  const vedicChartData = generateSampleVedicChartData();
  const humanDesignData = generateSampleHumanDesignData();

  const handleSaveBirthInfo = async () => {
    if (!birthDate) {
      toast({
        title: "Birth date required",
        description: "Please enter your birth date to generate charts",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, you would calculate the Vedic and Human Design data
      // based on birth information, or call an external API
      
      const updatedUser = {
        birthDate,
        birthTime,
        birthPlace,
        vedicChart: vedicChartData,
        humanDesignData: humanDesignData
      };

      await apiRequest('PATCH', `/api/users/profile`, updatedUser);
      
      toast({
        title: "Birth Information Saved",
        description: "Your spiritual profile has been updated",
        variant: "default"
      });

      // Refresh user data after update
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "There was a problem saving your birth information",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Spiritual Profile</h2>
      
      {isEditable && (
        <div className="p-6 bg-muted rounded-lg space-y-4">
          <h3 className="text-lg font-semibold mb-2">Edit Birth Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="birthTime">Birth Time (if known)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthTime"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  placeholder="e.g. 14:30"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="birthPlace">Birth Place (if known)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="e.g. New York, NY"
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveBirthInfo} 
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? 'Saving...' : 'Update Birth Information'}
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="vedic" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="vedic">Vedic Astrology</TabsTrigger>
          <TabsTrigger value="humandesign">Human Design</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vedic">
          <VedicAstrologyChart 
            chartData={vedicChartData}
            birthDate={birthDate}
            birthTime={birthTime}
            birthPlace={birthPlace}
          />
        </TabsContent>
        
        <TabsContent value="humandesign">
          <HumanDesignChart 
            designData={humanDesignData}
            birthDate={birthDate}
            birthTime={birthTime}
            birthPlace={birthPlace}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpiritualProfileSection;