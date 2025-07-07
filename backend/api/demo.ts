#!/usr/bin/env ts-node

/**
 * Demo script for AI Recruitment Agent API
 */

import { startServer } from "./server-simple";

async function demo() {
  try {
    console.log("🚀 Starting AI Recruitment Agent API Demo...\n");

    // Start the server
    const server = await startServer();
    console.log("✅ Server started successfully!\n");

    // Wait a moment for the server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("📋 Available API Endpoints:");
    console.log("  GET  /api/health                     - Health check");
    console.log("  POST /api/chat/message               - Process chat message");
    console.log("  POST /api/chat/upload-cv             - Upload CV file");
    console.log("  GET  /api/chat/session/:sessionId    - Get session details");
    console.log("  POST /api/chat/end-session           - End chat session");
    console.log("  GET  /api/admin/sessions             - Get active sessions");
    console.log("  DELETE /api/admin/sessions/cleanup   - Cleanup old sessions");
    console.log("\n💡 Example requests:");
    console.log("  curl -X GET http://localhost:3001/api/health");
    console.log("  curl -X POST http://localhost:3001/api/chat/message \\");
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"message":"Hello","sessionId":"demo-123"}\'');
    console.log("\n🎯 The API is now ready for testing!");
    console.log("   Press Ctrl+C to stop the server.\n");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { demo };
