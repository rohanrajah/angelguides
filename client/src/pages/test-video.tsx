import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCallContainer } from "@/components/chat/VideoCallContainer";
import { AudioCallContainer } from "@/components/chat/AudioCallContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestVideoPage() {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  
  // Mock session and participant IDs
  const sessionId = 123;
  const participantId = 456;
  const participantName = "Test Advisor";
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold">Test Video & Audio Calls</h1>
        <p className="text-muted-foreground mt-2">
          This page allows you to test WebRTC video and audio call functionality.
        </p>
      </div>
      
      <Tabs defaultValue="video">
        <TabsList className="mb-4">
          <TabsTrigger value="video">Video Call</TabsTrigger>
          <TabsTrigger value="audio">Audio Call</TabsTrigger>
        </TabsList>
        
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Video Call Test</span>
                <Button 
                  variant={isVideoActive ? "destructive" : "default"}
                  onClick={() => setIsVideoActive(!isVideoActive)}
                >
                  {isVideoActive ? "End Call" : "Start Call"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isVideoActive ? (
                <VideoCallContainer
                  sessionId={sessionId}
                  participantId={participantId}
                  isInitiator={true}
                  onEnd={() => setIsVideoActive(false)}
                />
              ) : (
                <div className="h-[500px] bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg">Click "Start Call" to test video functionality</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      This will request camera and microphone permissions from your browser
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audio Call Test</span>
                <Button 
                  variant={isAudioActive ? "destructive" : "default"}
                  onClick={() => setIsAudioActive(!isAudioActive)}
                >
                  {isAudioActive ? "End Call" : "Start Call"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAudioActive ? (
                <AudioCallContainer
                  sessionId={sessionId}
                  participantId={participantId}
                  participantName={participantName}
                  isInitiator={true}
                  onEnd={() => setIsAudioActive(false)}
                />
              ) : (
                <div className="h-[500px] bg-muted/10 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg">Click "Start Call" to test audio functionality</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      This will request microphone permissions from your browser
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Testing Video Call</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Click the "Start Call" button in the Video Call tab</li>
                <li>Allow camera and microphone permissions when prompted</li>
                <li>You should see your own video in both the main view and small picture-in-picture</li>
                <li>Test the controls: microphone mute/unmute, camera on/off, screen sharing</li>
                <li>Click "End Call" to stop the test</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Testing Audio Call</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Click the "Start Call" button in the Audio Call tab</li>
                <li>Allow microphone permissions when prompted</li>
                <li>You should see a call interface with timer</li>
                <li>Test the controls: microphone mute/unmute</li>
                <li>Click "End Call" to stop the test</li>
              </ol>
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium mb-2">Troubleshooting</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>If no video appears, ensure your camera is not in use by another application</li>
                <li>If audio doesn't work, check your browser's audio settings and permissions</li>
                <li>For best results, use Chrome, Firefox, or Edge browsers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}