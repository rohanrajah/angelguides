# AngelGuides - Spiritual Advisor Platform

A comprehensive platform connecting users with spiritual advisors through real-time audio/video calling, messaging, and AI-powered matching.

## 🌟 Features

### Real-Time Communication
- **WebRTC Audio/Video Calls**: High-quality peer-to-peer calling with signaling server
- **Real-Time Messaging**: Instant chat with message persistence and delivery confirmations
- **Session Management**: Complete session lifecycle with billing integration
- **WebSocket Integration**: Real-time signaling, messaging, and presence updates

### AI-Powered Matching
- **Angela AI Concierge**: Intelligent advisor matching through guided questionnaires
- **OpenAI Integration**: Advanced natural language processing for recommendations
- **Personalized Recommendations**: User-specific advisor suggestions based on needs

### Advisor Platform
- **Comprehensive Dashboard**: Earnings tracking, session management, and analytics
- **Availability Management**: Flexible scheduling and working hours
- **Review System**: Client feedback and rating management
- **Payout Integration**: Automated billing and payment processing

### Session & Billing Features
- **Real-Time Billing**: Per-minute session charging with live cost tracking
- **Multiple Session Types**: Chat, audio, video, and free consultations
- **Payment Processing**: Integrated billing with balance management
- **Session Notes**: Advisor session documentation and client history

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI + ShadCN** component library
- **TanStack Query** for state management
- **Wouter** for routing
- **WebRTC** for peer-to-peer communication

### Backend Stack
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **WebSocket (ws)** for real-time communication
- **Vitest** for testing (TDD approach)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd angelguidesver10
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/angelguides"
   OPENAI_API_KEY="your-openai-api-key"
   STRIPE_SECRET_KEY="your-stripe-secret-key" # Optional
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

### Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This starts both frontend (Vite) and backend (Express) in development mode.

2. **Frontend Only** (Port 5173)
   ```bash
   npm run dev:frontend
   ```

3. **Backend Only** (Port 3000)
   ```bash
   npm run dev:backend
   ```

### Building & Production

1. **Build the Application**
   ```bash
   npm run build
   ```
   This creates optimized production builds for both frontend and backend.

2. **Start Production Server**
   ```bash
   npm start
   ```
   Serves the built application on port 3000.

3. **Preview Production Build**
   ```bash
   npm run preview
   ```
   Preview the production build locally.

## 🧪 Testing

The project follows **Test-Driven Development (TDD)** methodology with comprehensive test coverage.

### Run All Tests
```bash
npm test
```

### Test Categories

1. **Unit Tests**
   ```bash
   npm run test:unit
   ```
   - Session API tests (23 tests)
   - Billing service tests (20 tests)
   - Message delivery tests (14 tests)
   - WebSocket manager tests (13 tests)
   - Signaling service tests (14 tests)

2. **Integration Tests**
   ```bash
   npm run test:integration
   ```
   - Frontend compatibility tests (21 tests)
   - WebSocket flow tests (19 tests)
   - Session lifecycle tests (15 tests)
   - Message API tests (10 tests)

3. **Watch Mode**
   ```bash
   npm run test:watch
   ```

### Test Coverage
Current test coverage: **135 tests** across all components with focus on:
- WebRTC signaling flows
- Real-time message delivery
- Session lifecycle management
- Billing and payment processing
- Frontend integration compatibility

## 📁 Project Structure

```
angelguidesver10/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── chat/        # Chat and calling components
│   │   │   ├── angela/      # AI concierge components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   └── pages/           # Page components
│   └── public/              # Static assets
├── server/                   # Backend Express application
│   ├── billing-service.ts   # Payment and billing logic
│   ├── message-service.ts   # Message persistence
│   ├── session-api.ts       # Session management API
│   ├── session-manager.ts   # Session state management
│   ├── signaling-service.ts # WebRTC signaling
│   ├── websocket-manager.ts # WebSocket connections
│   ├── routes.ts            # API routes
│   └── storage.ts           # Database access layer
├── shared/                   # Shared code between client/server
│   ├── schema.ts            # Database schema definitions
│   └── websocket-types.ts   # WebSocket message types
├── tests/                    # Test suites
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
└── docs/                     # Sprint documentation
```

## 🔌 API Endpoints

### Session Management
- `POST /api/sessions/start` - Start new session
- `GET /api/sessions/:id/status` - Get session status
- `POST /api/sessions/:id/join` - Join session
- `POST /api/sessions/:id/leave` - Leave session
- `POST /api/sessions/:id/end` - End session with billing
- `PUT /api/sessions/:id/notes` - Update session notes

### Messaging
- `POST /api/messages` - Send message
- `GET /api/messages/:userId1/:userId2` - Get conversation history
- `GET /api/messages/search` - Search messages
- `DELETE /api/messages/:id` - Delete message
- `PUT /api/messages/:id/read` - Mark as read

### User Management
- `POST /api/login` - User authentication
- `GET /api/me` - Get current user
- `GET /api/advisors` - List advisors
- `GET /api/advisors/:id` - Get advisor details

### AI Features
- `GET /api/angela/:userId/start-matching` - Start advisor matching
- `POST /api/angela/:userId/matching` - Continue matching flow

## 🔄 WebSocket Communication

### Connection
Connect to WebSocket at `ws://localhost:3000/ws`

### Authentication
```javascript
// Send authentication message
socket.send(JSON.stringify({
  type: 'auth',
  payload: { userId: 123 }
}))
```

### Message Types

#### WebRTC Signaling
- `signal_offer` - WebRTC offer
- `signal_answer` - WebRTC answer  
- `signal_ice_candidate` - ICE candidates
- `signal_end` - End call signal

#### Chat Messages
- `chat_message` - Real-time chat
- `typing_indicator` - Typing status
- `message_delivered` - Delivery confirmation
- `message_read` - Read receipts

#### Session Updates
- `session_update` - Session status changes
- `session_start` - Session initialization
- `session_end` - Session termination

## 🏃‍♂️ Sprint Development

This project was developed using **Agile Sprint methodology** with comprehensive Test-Driven Development:

### Completed Sprint Tickets
- ✅ **TICKET-001**: WebSocket Connection Management (8 pts)
- ✅ **TICKET-002**: WebRTC Signaling Protocol (8 pts)
- ✅ **TICKET-003**: Session State Management (6 pts)
- ✅ **TICKET-004**: Message Persistence API (5 pts)
- ✅ **TICKET-005**: Real-time Message Delivery (8 pts)
- ✅ **TICKET-006**: Session Lifecycle API (8 pts)
- ✅ **TICKET-007**: Frontend Integration Validation (3 pts)

**Total Story Points Completed**: 46/47 points

### Development Approach
1. **Red Phase**: Write comprehensive failing tests first
2. **Green Phase**: Implement minimal code to pass tests
3. **Refactor Phase**: Clean up and optimize code
4. **Integration**: Ensure frontend compatibility

## 🧑‍💻 Contributing

1. **Follow TDD Approach**: Always write tests before implementation
2. **Code Style**: Use TypeScript strict mode and ESLint rules
3. **Testing**: Maintain test coverage above 90%
4. **Documentation**: Update README for new features

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Write failing tests first (TDD Red phase)
npm test -- --watch

# Implement feature (TDD Green phase)
# Write minimal code to pass tests

# Refactor and optimize (TDD Refactor phase)
# Clean up code while keeping tests green

# Ensure all tests pass
npm test

# Build and verify
npm run build

# Commit and push
git commit -m "feat: implement your feature with TDD"
git push origin feature/your-feature
```

## 📋 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# Stripe (optional, for payments)
STRIPE_SECRET_KEY="sk_..."

# Development
NODE_ENV="development" # or "production"
PORT="3000" # Server port
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL is running
   sudo service postgresql status
   
   # Verify DATABASE_URL in .env
   echo $DATABASE_URL
   ```

2. **WebSocket Connection Failed**
   ```bash
   # Ensure backend server is running
   npm run dev:backend
   
   # Check port 3000 is available
   lsof -i :3000
   ```

3. **Build Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear build cache
   rm -rf dist
   npm run build
   ```

## 📜 License

[Add your license information here]

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review test files for usage examples

---

Built with ❤️ using Test-Driven Development and modern web technologies.