#!/usr/bin/env ts-node

import { startServer } from "./server";

/**
 * Demo script for the AI Recruitment Agent API
 * Shows all available routes and their usage
 */
async function demo() {
  try {
    console.log("🚀 Starting AI Recruitment Agent API Demo...");
    await startServer();

    console.log("\n📋 Available API Routes:");
    console.log("========================");

    console.log("\n🔧 System Routes:");
    console.log("  GET  /api/health                    - Health check");
    console.log("  GET  /api/system/health             - System health check");
    console.log("  GET  /api/system/stats              - System statistics (admin)");
    console.log("  GET  /api/system/info               - System information (admin)");

    console.log("\n💬 Chat Routes:");
    console.log("  POST /api/chat/message              - Process chat message");
    console.log("  POST /api/chat/upload-cv            - Upload CV file");
    console.log("  GET  /api/chat/session/:sessionId   - Get session details");
    console.log("  POST /api/chat/end-session          - End chat session");
    console.log("  GET  /api/chat/sessions             - Get active sessions (admin)");
    console.log("  DEL  /api/chat/sessions/cleanup     - Cleanup old sessions (admin)");

    console.log("\n👥 HR Routes:");
    console.log("  GET  /api/hr/candidates             - List candidates");
    console.log("  GET  /api/hr/reports/:candidateId   - Get candidate report");
    console.log("  PUT  /api/hr/candidates/:id/status  - Update candidate status");
    console.log("  GET  /api/hr/analytics              - HR analytics");
    console.log("  GET  /api/hr/export/candidates      - Export candidates CSV");

    console.log("\n🔄 Simple Routes (alternative controllers):");
    console.log("  POST /api/simple/chat/message       - Simple chat controller");
    console.log("  POST /api/simple/chat/upload-cv     - Simple CV upload");
    console.log("  GET  /api/simple/chat/session/:id   - Simple session details");
    console.log("  POST /api/simple/chat/end-session   - Simple end session");
    console.log("  GET  /api/simple/admin/sessions     - Simple admin sessions");
    console.log("  DEL  /api/simple/admin/sessions/cleanup - Simple cleanup sessions");
    console.log("  GET  /api/simple/health             - Simple health check");

    console.log("\n🔄 Legacy Routes (backward compatibility):");
    console.log("  POST /api/legacy/chat/message       - Legacy chat with RecruitingAgent");
    console.log("  GET  /api/legacy/chat/session/:id   - Legacy session details");
    console.log("  GET  /api/legacy/admin/sessions     - Legacy admin sessions");

    console.log("\n📖 Documentation:");
    console.log("  GET  /api/                          - API documentation");

    console.log("\n✨ Demo completed! Server is running and ready to receive requests.");
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

demo();
