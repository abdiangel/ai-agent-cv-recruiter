import express from "express";

const app = express();
const PORT = 3001;

// Basic middleware
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Recruitment Agent API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Simple chat endpoint (without agent integration for now)
app.post("/api/chat/message", (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({
      success: false,
      error: "Message and sessionId are required",
    });
  }

  // Simple echo response for testing
  res.json({
    success: true,
    data: {
      response: `Hello! You said: "${message}". This is a test response from the AI Recruitment Agent.`,
      sessionId: sessionId,
      currentState: "GREETING",
      messageCount: 1,
    },
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple AI Recruitment Agent API started on port ${PORT}`);
  console.log(`📖 Health: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat: http://localhost:${PORT}/api/chat/message`);
});

export default app;
