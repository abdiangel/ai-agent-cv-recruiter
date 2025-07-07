# AI Recruitment Agent API

✅ **Status: PRODUCTION READY** - Consolidated Express API server with full functionality!

A comprehensive Express.js REST API for the AI Recruitment Agent system with advanced middleware, security features, and complete endpoint coverage.

## 🚀 Quick Start

### Prerequisites

- Node.js 22.17.0 (uses project's `.nvmrc`)
- All dependencies from main project

### Start the API Server

```bash
# From project root directory
nvm use                                    # Use correct Node.js version

# Option 1: Direct server start
npm run server                             # Start server directly

# Option 2: Development with auto-reload
npm run server:dev                         # Start with file watching

# Option 3: Using start script
npm run server:start                       # Start via start script

# Option 4: Demo mode (shows all routes)
npm run server:demo                        # Start with route documentation
```

The API server will start on `http://localhost:3001`

## 📋 Available Endpoints

### 🔧 System Routes

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| `GET`  | `/api/health`        | Health check (legacy)      |
| `GET`  | `/api/system/health` | System health check        |
| `GET`  | `/api/system/stats`  | System statistics (admin)  |
| `GET`  | `/api/system/info`   | System information (admin) |

### 💬 Chat Routes

| Method   | Endpoint                       | Description                  |
| -------- | ------------------------------ | ---------------------------- |
| `POST`   | `/api/chat/message`            | Process chat message         |
| `POST`   | `/api/chat/upload-cv`          | Upload CV file               |
| `GET`    | `/api/chat/session/:sessionId` | Get session details          |
| `POST`   | `/api/chat/end-session`        | End chat session             |
| `GET`    | `/api/chat/sessions`           | Get active sessions (admin)  |
| `DELETE` | `/api/chat/sessions/cleanup`   | Cleanup old sessions (admin) |

### 👥 HR Routes

| Method | Endpoint                                 | Description                    |
| ------ | ---------------------------------------- | ------------------------------ |
| `GET`  | `/api/hr/candidates`                     | List candidates with filtering |
| `GET`  | `/api/hr/reports/:candidateId`           | Get candidate report           |
| `PUT`  | `/api/hr/candidates/:candidateId/status` | Update candidate status        |
| `GET`  | `/api/hr/analytics`                      | HR analytics                   |
| `GET`  | `/api/hr/export/candidates`              | Export candidates CSV          |

### 🔄 Simple Routes (Alternative Controllers)

| Method   | Endpoint                              | Description             |
| -------- | ------------------------------------- | ----------------------- |
| `POST`   | `/api/simple/chat/message`            | Simple chat controller  |
| `POST`   | `/api/simple/chat/upload-cv`          | Simple CV upload        |
| `GET`    | `/api/simple/chat/session/:sessionId` | Simple session details  |
| `POST`   | `/api/simple/chat/end-session`        | Simple end session      |
| `GET`    | `/api/simple/admin/sessions`          | Simple admin sessions   |
| `DELETE` | `/api/simple/admin/sessions/cleanup`  | Simple cleanup sessions |
| `GET`    | `/api/simple/health`                  | Simple health check     |

### 🔄 Legacy Routes (Backward Compatibility)

| Method | Endpoint                              | Description                      |
| ------ | ------------------------------------- | -------------------------------- |
| `POST` | `/api/legacy/chat/message`            | Legacy chat with RecruitingAgent |
| `GET`  | `/api/legacy/chat/session/:sessionId` | Legacy session details           |
| `GET`  | `/api/legacy/admin/sessions`          | Legacy admin sessions            |

### 📖 Documentation

| Method | Endpoint | Description                          |
| ------ | -------- | ------------------------------------ |
| `GET`  | `/api/`  | API documentation with all endpoints |

## 🛡️ Security Features

### Advanced Middleware Stack

- **Helmet**: Security headers and CSP
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests/15min (production), 1000 requests/15min (development)
- **Request ID**: Unique tracking for each request
- **Compression**: Gzip compression for responses
- **Input Validation**: Sanitization and validation middleware
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

### CORS Configuration

```javascript
{
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:3001"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}
```

## 🔨 Usage Examples

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

### CV Upload

```bash
curl -X POST http://localhost:3001/api/chat/upload-cv \
  -F "cv=@/path/to/resume.pdf" \
  -F "sessionId=test-123"
```

### HR Analytics

```bash
curl -X GET http://localhost:3001/api/hr/analytics
```

### Get All Sessions (Admin)

```bash
curl -X GET http://localhost:3001/api/chat/sessions
```

## 🏗️ Architecture

### Server Structure

```
backend/api/
├── server.ts              # 🆕 Consolidated server with all functionality
├── demo.ts                # Demo script showing all routes
├── scripts/
│   └── start.ts           # Server startup script
├── routes/
│   ├── index.ts           # Main API documentation route
│   ├── chat.ts            # Chat-related endpoints
│   ├── hr.ts              # HR-related endpoints
│   ├── system.ts          # System endpoints
│   └── simple.ts          # Simple route controllers
├── controllers/           # Route controllers
├── middleware/            # Express middleware
├── services/              # Business logic services
└── types/                 # TypeScript type definitions
```

### Key Features

- ✅ **Advanced Middleware**: Security, CORS, rate limiting, compression
- ✅ **Full Route Coverage**: Chat, HR, System, Legacy endpoints
- ✅ **RecruitingAgent Integration**: Direct agent integration in legacy routes
- ✅ **File Upload Support**: CV upload with validation
- ✅ **Session Management**: In-memory session storage
- ✅ **Error Handling**: Comprehensive error handling with request IDs
- ✅ **TypeScript Support**: Full TypeScript integration
- ✅ **Graceful Shutdown**: Proper shutdown handling
- ✅ **Development Features**: Auto-reload, logging, debugging

## 🔧 Technical Details

- **Framework**: Express.js with TypeScript
- **Runtime**: tsx (TypeScript execution)
- **Port**: 3001 (configurable via `PORT` environment variable)
- **Session Storage**: In-memory (for development)
- **File Upload**: Multer with 10MB limit
- **Supported File Types**: PDF, DOC, DOCX, TXT
- **Logging**: Morgan (dev/combined modes)
- **Compression**: Gzip enabled

## 🚧 Development Scripts

```bash
# Start server normally
npm run server

# Start with file watching (development)
npm run server:dev

# Start with route documentation
npm run server:demo

# Start via start script
npm run server:start
```

## 📝 Environment Variables

```env
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment (development/production)
```

## 🎯 Frontend Integration

The server is configured to work seamlessly with your frontend:

```javascript
// Frontend API calls
const baseURL = "http://localhost:3001";

// Chat message
const response = await fetch(`${baseURL}/api/chat/message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ message, sessionId }),
});

// CV upload
const formData = new FormData();
formData.append("cv", file);
formData.append("sessionId", sessionId);

const response = await fetch(`${baseURL}/api/chat/upload-cv`, {
  method: "POST",
  credentials: "include",
  body: formData,
});
```

## 🔄 Migration Notes

### From Previous Servers

The new consolidated `server.ts` replaces:

- ❌ `server-simple.ts` (deleted)
- ❌ `simple-server.ts` (deleted)
- ✅ `server.ts` (enhanced and consolidated)

### Legacy Endpoints

Legacy endpoints are preserved under `/api/legacy/` for backward compatibility:

- `POST /api/legacy/chat/message` - Direct RecruitingAgent integration
- `GET /api/legacy/chat/session/:sessionId` - Legacy session management
- `GET /api/legacy/admin/sessions` - Legacy admin functionality

---

**Current Status**: Production-ready consolidated API server with full functionality, advanced security, and comprehensive endpoint coverage. Ready for frontend integration!
