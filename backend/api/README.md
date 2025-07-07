# AI Recruitment Agent API

✅ **Status: WORKING** - Simple Express API server is functional!

A functional Express.js REST API for the AI Recruitment Agent system. Currently provides basic chat endpoints with plans for full agent integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 22.17.0 (uses project's `.nvmrc`)
- All dependencies from main project

### Start the API Server

```bash
# From project root directory
nvm use                                    # Use correct Node.js version
npx tsx backend/api/simple-server.ts      # Start the server
```

The API server will start on `http://localhost:3001`

## 📋 Available Endpoints

### Health Check

```bash
curl -X GET http://localhost:3001/api/health
```

**Response:**

```json
{
  "success": true,
  "message": "AI Recruitment Agent API is running",
  "timestamp": "2024-01-15T15:10:00.000Z",
  "version": "1.0.0"
}
```

### Chat Message

```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I am interested in a software engineer position", "sessionId": "test-123"}'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "Hello! You said: \"Hello, I am interested in a software engineer position\". This is a test response from the AI Recruitment Agent.",
    "sessionId": "test-123",
    "currentState": "GREETING",
    "messageCount": 1
  },
  "timestamp": "2024-01-15T15:10:00.000Z"
}
```

## 🏗️ Current Implementation

### Working Features

- ✅ Express.js server with TypeScript
- ✅ Health check endpoint
- ✅ Basic chat message endpoint
- ✅ JSON request/response handling
- ✅ Error handling for missing parameters
- ✅ CORS support
- ✅ Graceful startup/shutdown

### Architecture

```
backend/api/
├── simple-server.ts    # Main Express server (working)
├── server.ts          # Full server (has TypeScript issues)
└── README.md          # This documentation
```

## 🔧 Technical Details

- **Framework**: Express.js with TypeScript
- **Runtime**: tsx (TypeScript execution)
- **Port**: 3001
- **Dependencies**: Uses existing project dependencies
- **Session Management**: In-memory (for development)

## 🚧 Next Steps (Integration Roadmap)

1. **Agent Integration**
   - Connect to `RecruitingAgent` class
   - Integrate conversation state management
   - Add proper session persistence

2. **CV Processing**
   - File upload endpoint with multer
   - CV parsing integration
   - Document storage

3. **Enhanced Features**
   - Session management endpoints
   - Admin/analytics endpoints
   - Websocket support for real-time chat

4. **Production Readiness**
   - Database integration
   - Authentication/authorization
   - Rate limiting and security
   - Logging and monitoring

## 🎯 Testing Commands

```bash
# Start server
npx tsx backend/api/simple-server.ts

# In another terminal:
# Test health
curl -X GET http://localhost:3001/api/health

# Test chat
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test-123"}'

# Test error handling
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'  # Missing sessionId
```

## 📝 Development Notes

- Uses existing project structure and dependencies
- No separate package.json needed in backend/api/
- TypeScript compilation handled by tsx
- Simple implementation focuses on functionality over complexity
- Ready for incremental enhancement

---

**Current Status**: Basic REST API is functional and ready for testing. Next phase involves integrating with the existing AI agent logic.
