import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import { LiveChatSession } from '../chat/LiveChatSession';
import { VideoCallContainer } from '../chat/VideoCallContainer';
import { User } from '@shared/schema';

interface AdvisorCardProps {
  advisor: User;
  specialties?: Array<{ id: number; name: string; icon: string }>;
  currentUserId?: number;
  highlighted?: boolean;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < (rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">
        {rating ? `${rating}.0` : 'New'}
      </span>
    </div>
  );
};

export function AdvisorCard({ advisor, specialties = [], currentUserId, highlighted = false }: AdvisorCardProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'chat' | 'audio' | 'video' | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  const handleInitiateChat = () => {
    setSessionType('chat');
    createSessionAndStart('chat');
  };
  
  const handleInitiateAudioCall = () => {
    setSessionType('audio');
    createSessionAndStart('audio');
  };
  
  const handleInitiateVideoCall = () => {
    setSessionType('video');
    createSessionAndStart('video');
  };
  
  const createSessionAndStart = async (type: 'chat' | 'audio' | 'video') => {
    if (!currentUserId) return;
    
    try {
      // Determine rate based on session type
      const rate = type === 'chat' 
        ? advisor.chatRate 
        : type === 'audio' 
          ? advisor.audioRate 
          : advisor.videoRate;
      
      // Create a new session
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          advisorId: advisor.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 60000), // 30 min default
          sessionType: type,
          ratePerMinute: rate,
          notes: `Instant ${type} session with ${advisor.name}`
        }),
      });
      
      if (response.ok) {
        const session = await response.json();
        
        // Start the session
        const startResponse = await fetch(`/api/sessions/${session.id}/start`, {
          method: 'POST',
        });
        
        if (startResponse.ok) {
          setSessionId(session.id);
          setIsSessionActive(true);
        }
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };
  
  const handleCloseSession = async () => {
    if (!sessionId) return;
    
    try {
      // End the session in the backend
      await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
      });
      
      setIsSessionActive(false);
      setSessionId(null);
      setSessionType(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };
  
  const advisorInitials = advisor.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();
  
  return (
    <>
      <Card className={`overflow-hidden transition-shadow hover:shadow-md ${
        highlighted ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}>
        <CardHeader className="pb-2">
          {highlighted && (
            <div className="absolute -top-1 -right-1 z-10">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium px-2 py-1 rounded-md shadow-lg">
                Recommended for you
              </Badge>
            </div>
          )}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={advisor.avatar === null ? undefined : advisor.avatar} />
                <AvatarFallback>{advisorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{advisor.name}</CardTitle>
                <CardDescription className="mt-1">
                  <StarRating rating={advisor.rating || 0} />
                </CardDescription>
              </div>
            </div>
            
            <OnlineStatusIndicator 
              advisorId={advisor.id}
              initialOnlineStatus={advisor.online || false}
              onInitiateChat={currentUserId ? handleInitiateChat : undefined}
              onInitiateAudioCall={currentUserId ? handleInitiateAudioCall : undefined}
              onInitiateVideoCall={currentUserId ? handleInitiateVideoCall : undefined}
              showButtons={!!currentUserId}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {advisor.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{advisor.bio}</p>}
          
          <div className="flex flex-wrap gap-1 mb-4">
            {specialties.map(specialty => (
              <Badge key={specialty.id} variant="secondary" className="text-xs">
                {specialty.name}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Chat: {formatCurrency(advisor.chatRate || 0)}/min</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Audio: {formatCurrency(advisor.audioRate || 0)}/min</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Video: {formatCurrency(advisor.videoRate || 0)}/min</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-4 flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => setBookingDialogOpen(true)}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Book Session
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs"
            asChild
          >
            <Link href={`/advisors/${advisor.id}`}>View Profile</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Session with {advisor.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setSessionType('chat')}
                  className={sessionType === 'chat' ? 'border-primary' : ''}
                >
                  Chat
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setSessionType('audio')}
                  className={sessionType === 'audio' ? 'border-primary' : ''}
                >
                  Audio
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setSessionType('video')}
                  className={sessionType === 'video' ? 'border-primary' : ''}
                >
                  Video
                </Button>
              </div>
            </div>
            
            {sessionType && (
              <div className="space-y-2">
                <Label>Rate</Label>
                <div className="p-2 bg-muted rounded-md text-center">
                  <p className="text-lg font-medium">
                    {formatCurrency(
                      sessionType === 'chat' 
                        ? advisor.chatRate || 0
                        : sessionType === 'audio'
                          ? advisor.audioRate || 0
                          : advisor.videoRate || 0
                    )}/min
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({formatCurrency(
                      sessionType === 'chat' 
                        ? (advisor.chatRate || 0) * 60
                        : sessionType === 'audio'
                          ? (advisor.audioRate || 0) * 60
                          : (advisor.videoRate || 0) * 60
                    )}/hour)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBookingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              disabled={!sessionType || !currentUserId}
              onClick={() => {
                if (sessionType) {
                  createSessionAndStart(sessionType);
                  setBookingDialogOpen(false);
                }
              }}
            >
              {advisor.online ? 'Start Session Now' : 'Schedule Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Live Session Dialog */}
      <Dialog open={isSessionActive} onOpenChange={(open) => {
        if (!open) handleCloseSession();
      }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {sessionType === 'chat' && sessionId && (
            <LiveChatSession
              sessionId={sessionId}
              userId={currentUserId!}
              participantId={advisor.id}
              participantName={advisor.name}
              participantAvatar={advisor.avatar === null ? undefined : advisor.avatar}
              onClose={handleCloseSession}
            />
          )}
          
          {(sessionType === 'audio' || sessionType === 'video') && sessionId && (
            <VideoCallContainer
              sessionId={sessionId}
              participantId={advisor.id}
              isInitiator={true}
              onEnd={handleCloseSession}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}