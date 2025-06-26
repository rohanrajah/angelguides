// WebSocket message types for real-time communication
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp?: Date;
  from?: number;
  to?: number;
  sessionId?: number;
}

export enum WebSocketMessageType {
  // Connection management
  PING = 'ping',
  PONG = 'pong',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  
  // WebRTC signaling
  SIGNAL_OFFER = 'signal_offer',
  SIGNAL_ANSWER = 'signal_answer', 
  SIGNAL_ICE_CANDIDATE = 'signal_ice_candidate',
  SIGNAL_END = 'signal_end',
  
  // Chat messages
  CHAT_MESSAGE = 'chat_message',
  TYPING_INDICATOR = 'typing_indicator',
  MESSAGE_READ = 'message_read',
  
  // Session management
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_UPDATE = 'session_update',
  SESSION_JOIN = 'session_join',
  SESSION_LEAVE = 'session_leave',
  
  // Error handling
  ERROR = 'error'
}

// WebRTC signaling message payloads
export interface SignalingOffer {
  sessionId: number;
  offer: RTCSessionDescriptionInit;
  callType: 'audio' | 'video';
}

export interface SignalingAnswer {
  sessionId: number;
  answer: RTCSessionDescriptionInit;
}

export interface SignalingIceCandidate {
  sessionId: number;
  candidate: RTCIceCandidateInit;
}

export interface SignalingEnd {
  sessionId: number;
  reason?: string;
}

// Chat message payloads
export interface ChatMessagePayload {
  id?: string;
  sessionId: number;
  content: string;
  messageType: 'text' | 'system';
}

export interface TypingIndicatorPayload {
  sessionId: number;
  isTyping: boolean;
}

// Session management payloads
export interface SessionStartPayload {
  sessionId: number;
  advisorId: number;
  userId: number;
  sessionType: 'chat' | 'audio' | 'video';
  ratePerMinute: number;
}

export interface SessionUpdatePayload {
  sessionId: number;
  status: 'connecting' | 'active' | 'ending' | 'completed';
  participants?: number[];
  duration?: number;
}

// Error payload
export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}