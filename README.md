# AI Recruitment Agent

A comprehensive AI-powered recruitment system with conversational capabilities, CV processing, candidate screening, intention detection, jailbreak protection, and automated HR workflows.

## 🏗️ Project Structure

This project is organized into clear, separate layers for optimal development workflow:

```
ai-agent-recruiter/
├── backend/
│   ├── agent/                    # AI Agent Logic Layer
│   │   ├── core/                 # Main RecruitingAgent orchestration
│   │   ├── intention/            # Intention detection system
│   │   ├── state/                # State machine management
│   │   ├── cv/                   # CV parsing and analysis
│   │   ├── security/             # Jailbreak detection and security
│   │   ├── utils/                # Shared utilities
│   │   ├── examples/             # Demo scripts
│   │   └── index.ts              # Agent module exports
│   └── api/                      # API Server Layer (planned)
│       ├── routes/               # Express route handlers
│       ├── middleware/           # Custom middleware
│       ├── controllers/          # Business logic controllers
│       └── models/               # Database models
├── frontend/                     # React Frontend Layer (planned)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom React hooks
│   │   └── services/             # API service functions
│   └── public/                   # Static assets
└── tests/                        # Test files mirroring structure
    └── backend/
        └── agent/
            ├── core/
            ├── intention/
            └── state/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22.17.0 (use `nvm use` to ensure correct version)
- npm 10.9.2+

### Installation

```bash
npm install
```

### Running Tests

```bash
npm test
```

### Running Demos

```bash
# Basic agent demo
npm run demo

# Or run specific demos
npx tsx backend/agent/examples/agent-demo.ts
npx tsx backend/agent/examples/recruiting-agent-demo.ts
```

### Development

```bash
# Type checking
npm run type-check

# Build
npm run build

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## 🧩 System Components

### 🤖 AI Agent Layer (`backend/agent/`)

**Core Orchestration**

- `RecruitingAgent`: Main orchestration class managing all components
- Session management and conversation tracking
- Real-time analytics and monitoring

**Intention Detection**

- Multi-language support (English, Spanish, French)
- Pattern-based intention classification
- Context validation and confidence scoring

**State Management**

- Configurable conversation flow state machine
- Dynamic state transitions based on intentions
- State history tracking and validation

**CV Processing**

- Intelligent document parsing (PDF, DOC, TXT)
- Skill extraction and analysis
- Candidate profile generation with confidence scoring

**Security & Jailbreak Detection**

- Advanced pattern-based security detection
- Risk assessment and threat analysis
- Behavioral analysis and context validation

**Utilities**

- Centralized logging system
- Pattern matching and text processing
- Configuration management

### 🌐 API Layer (`backend/api/`) - _Planned_

- REST API endpoints for frontend integration
- WebSocket support for real-time chat
- Authentication and authorization
- File upload handling
- Database integration with MongoDB
- Rate limiting and security middleware

### 🎨 Frontend Layer (`frontend/`) - _Planned_

- React-based chat interface
- CV upload component
- HR dashboard and analytics
- Real-time conversation monitoring
- Multi-language support UI

## 🔧 Configuration

The system is highly configurable through the `RecruitingAgentConfig` interface:

```typescript
const agent = new RecruitingAgent({
  enableJailbreakDetection: true,
  enableCVParsing: true,
  enableAnalytics: true,
  supportedLanguages: ["en", "es", "fr"],
  defaultLanguage: "en",
  personalizedResponses: true,
  enableInterviewFlow: true,
});
```

## 🧪 Testing

Comprehensive test suite covering all components:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests in watch mode
npm run test:ui
```

Test files are organized to mirror the source structure for easy navigation.

## 📦 Technology Stack

**Core Technologies:**

- TypeScript for type safety
- Node.js 22.17.0 runtime
- Vitest for testing

**AI & Processing:**

- Custom pattern matching algorithms
- Intelligent text processing
- State machine implementation

**Planned Integrations:**

- Express.js for API server
- MongoDB for data persistence
- React for frontend interface
- Socket.io for real-time features

## 🛡️ Security Features

- Advanced jailbreak detection
- Pattern-based threat analysis
- Input validation and sanitization
- Rate limiting and abuse prevention
- Comprehensive security logging

## 🚀 Development Roadmap

### Phase 1: ✅ Agent Logic (Current)

- Core AI agent implementation
- Intention detection system
- State machine management
- CV processing capabilities
- Security and jailbreak detection

### Phase 2: 🔄 Backend API (Next)

- REST API implementation
- Database integration
- Authentication system
- File upload handling
- WebSocket support

### Phase 3: 🎯 Frontend Interface

- React-based chat interface
- HR dashboard
- Real-time monitoring
- Analytics visualization

### Phase 4: 🚀 Production Features

- Scalability improvements
- Advanced analytics
- Multi-tenant support
- Enterprise integrations

## 📝 License

This project is licensed under the ISC License.
