# AI Agent Recruiter - Frontend

A modern React chat interface for the AI Agent Recruiter application, built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Real-time Chat Interface**: Interactive chat with the AI recruiting agent
- **CV Upload**: Drag-and-drop or click to upload PDF, DOC, DOCX, or TXT files
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback during API calls and file uploads
- **Session Management**: Automatic session handling with localStorage
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Full type safety
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Dropzone**: File upload with drag-and-drop
- **Lucide React**: Beautiful icons

## Getting Started

### Prerequisites

- Node.js 22.17.0 (use nvm with the provided .nvmrc file)
- npm 10.9.2 or higher

### Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Use the correct Node.js version:

```bash
nvm use
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Backend Connection

The frontend is configured to proxy API requests to the backend server at `http://localhost:3001`. Make sure the backend is running before starting the frontend.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatMessage.tsx  # Individual message component
│   ├── ChatInput.tsx    # Message input component
│   ├── ChatWindow.tsx   # Chat messages container
│   ├── FileUpload.tsx   # File upload component
│   └── ErrorMessage.tsx # Error display component
├── hooks/              # Custom React hooks
│   └── useChat.ts      # Chat state management
├── services/           # API services
│   └── api.ts          # Axios API client
├── types/              # TypeScript type definitions
│   ├── api.ts          # API response types
│   └── chat.ts         # Chat state types
├── utils/              # Utility functions
│   └── sessionManager.ts # Session management
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## API Integration

The frontend communicates with the backend through the following endpoints:

- `POST /api/chat/message` - Send chat messages
- `POST /api/chat/upload-cv` - Upload CV files
- `GET /api/chat/session/:sessionId` - Get session details
- `POST /api/chat/end-session` - End chat session

## Features in Detail

### Chat Interface

- Real-time messaging with the AI agent
- Message history with timestamps
- Typing indicators
- Auto-scrolling to latest messages

### File Upload

- Drag-and-drop file upload
- Support for PDF, DOC, DOCX, and TXT files
- File size limit of 10MB
- Progress indicators and error handling

### Error Handling

- Network error handling
- API error display
- User-friendly error messages
- Dismissible error notifications

### Session Management

- Automatic session ID generation
- Session persistence in localStorage
- Reset functionality

## Styling

The application uses Tailwind CSS for styling with a custom design system:

- **Primary Color**: Blue theme (#3b82f6)
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent spacing scale
- **Responsive**: Mobile-first responsive design

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper error handling
4. Include JSDoc comments for functions
5. Test on multiple screen sizes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
