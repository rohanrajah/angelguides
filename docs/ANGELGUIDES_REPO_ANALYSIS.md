# AngelGuides Repository Analysis & Backend Development Context

## Overview
AngelGuides is a spiritual advisor platform with comprehensive audio/video calling UI components and advisor matching system. The frontend is fully developed with React/TypeScript, but backend components need significant development for real-time communication features.

## Architecture Summary

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query, React hooks
- **UI Framework**: Radix UI + ShadCN components  
- **Styling**: Tailwind CSS
- **Real-time**: WebSocket integration (client-side implemented)
- **Authentication**: Firebase integration (partial)

### Backend Stack  
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **WebSocket**: ws library (basic implementation)
- **Authentication**: Basic username/password (needs enhancement)
- **AI Integration**: OpenAI API for advisor matching

## Core Features Analysis

### 1. User Management System ✅ IMPLEMENTED
**Location**: `client/src/hooks/use-auth.tsx`, `server/routes.ts:232-286`

- Multi-role system (USER, ADVISOR, ADMIN)
- Profile management with spiritual data (birth details, charts)
- Account balance and earnings tracking
- Basic authentication flow

### 2. Advisor Platform ✅ IMPLEMENTED  
**Location**: `client/src/pages/advisor-dashboard.tsx`, `server/routes.ts:49-76`

- Comprehensive advisor dashboard
- Specialty management system
- Availability scheduling (`workingHours` schema)
- Review and rating system
- Earnings and payout tracking

### 3. AI Concierge (Angela) ✅ IMPLEMENTED
**Location**: `client/src/components/angela/`, `server/routes.ts:290-377`

- Advisor matching questionnaire flow
- OpenAI-powered recommendations  
- Voice interaction components
- Conversation history storage

## Audio/Video Calling System Analysis

### Frontend Components ✅ FULLY IMPLEMENTED

#### AudioCallContainer (`client/src/components/chat/AudioCallContainer.tsx`)
- **WebRTC Implementation**: Complete peer-to-peer audio calling
- **Features**: Mute/unmute, call duration timer, connection status
- **Signaling**: Uses WebSocket for offer/answer/ICE candidate exchange
- **Error Handling**: Comprehensive error handling and cleanup

#### VideoCallContainer (`client/src/components/chat/VideoCallContainer.tsx`)  
- **WebRTC Implementation**: Full video calling with screen sharing
- **Features**: Camera toggle, audio toggle, screen sharing, PiP local video
- **UI**: Professional call interface with floating controls
- **Media Handling**: Dynamic stream replacement for screen sharing

#### LiveChatSession (`client/src/components/chat/LiveChatSession.tsx`)
- **Multi-mode Interface**: Seamless switching between chat/audio/video
- **Message System**: Real-time messaging with WebSocket
- **Session Management**: Session lifecycle management
- **User Experience**: Intuitive mode switching with visual feedback

### Backend Implementation Status

#### ❌ MISSING: WebRTC Signaling Server
**Current State**: Basic WebSocket setup exists but no signaling logic
```typescript
// server/routes.ts:380-393 - Only basic ping/pong
wss.on('connection', (socket: WebSocket) => {
  console.log('New WebSocket connection established');
  
  socket.on('message', (message) => {
    if (message.toString() === 'ping') {
      socket.send('pong');
    }
  });
});
```

**Required Implementation**:
- WebRTC signaling message routing (`signal_offer`, `signal_answer`, `signal_ice_candidate`)
- Session management for active calls
- User presence tracking
- Call session persistence

#### ❌ MISSING: Session Management Backend
**Database Schema**: `sessions` table exists but no active session API
**Required APIs**:
- `POST /api/sessions/start` - Initialize calling session
- `GET /api/sessions/:id/status` - Get session status  
- `POST /api/sessions/:id/end` - End session with billing
- WebSocket session state management

#### ❌ MISSING: Real-time Messaging Backend  
**Current State**: Basic message schema exists, no real-time delivery
**Required Implementation**:
- Message persistence API
- Real-time message delivery via WebSocket
- Message history retrieval
- Read receipts and typing indicators

#### ❌ MISSING: Billing Integration
**Schema Ready**: Transaction system designed but not implemented
**Required Implementation**:
- Real-time session billing (per-minute charging)
- Stripe payment processing integration
- Balance management APIs
- Advisor payout system

## Development Priority Roadmap

### Phase 1: Core Communication Backend (High Priority)
1. **WebSocket Signaling Server** 
   - Implement WebRTC signaling message routing
   - Add session management for active calls
   - User connection state tracking

2. **Message System Backend**
   - Real-time message delivery
   - Message persistence APIs
   - Chat history endpoints

3. **Session Management APIs**
   - Session lifecycle management
   - Active session tracking
   - Session billing calculation

### Phase 2: Enhanced Features (Medium Priority)  
1. **Advanced Session Features**
   - Call recording capabilities
   - Session notes and summaries
   - Quality metrics tracking

2. **Payment System Integration**
   - Stripe Connect for advisor payouts
   - Real-time balance updates
   - Transaction history APIs

3. **Enhanced Real-time Features**
   - Typing indicators
   - Read receipts  
   - User presence/online status

### Phase 3: Production Features (Lower Priority)
1. **Monitoring and Analytics**
   - Call quality metrics
   - Usage analytics
   - Performance monitoring

2. **Advanced Security**
   - Call encryption
   - Session recording compliance
   - Data retention policies

## Key Files for Backend Development

### WebSocket Implementation
- `server/routes.ts:380-393` - Extend WebSocket handlers
- `client/src/lib/websocket.ts` - Reference for message types

### Database Integration  
- `shared/schema.ts` - Complete database schema
- `server/storage.ts` - Database access layer (extend as needed)

### Session Management
- `shared/schema.ts:103-118` - Sessions table schema
- `shared/schema.ts:131-137` - Messages table schema

### Authentication & Authorization
- `server/auth.ts` - Password utilities
- `server/routes.ts:232-286` - Authentication endpoints

## WebSocket Message Protocol (Frontend Expects)

Based on frontend components, the backend should handle these message types:

```typescript
// Signaling messages for WebRTC
'signal_offer' | 'signal_answer' | 'signal_ice_candidate' | 'signal_end'

// Chat messages  
'chat_message'

// Session management
'session_start' | 'session_end' | 'session_update'

// User presence
'user_online' | 'user_offline'
```

## Recommended Implementation Approach

1. **Start with WebSocket Signaling**: Extend `server/routes.ts` WebSocket handler to route signaling messages between connected clients

2. **Implement Session APIs**: Create REST endpoints for session management using existing `sessions` schema

3. **Add Message Persistence**: Implement real-time messaging with database persistence using existing `messages` schema

4. **Integrate Billing**: Connect session duration tracking with existing `transactions` schema for automatic billing

This analysis provides a complete roadmap for implementing the backend components needed to support the fully-developed frontend audio/video calling system.