#!/usr/bin/env node

/**
 * Demo script for AI Agent Recruiter Frontend
 * This script demonstrates how to run the frontend and backend together
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting AI Agent Recruiter Demo...\n");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function startBackend() {
  log("📡 Starting Backend API Server...", colors.blue);

  // Start backend server
  const backend = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, "..", "backend"),
    stdio: "inherit",
    shell: true,
  });

  backend.on("error", (err) => {
    log(`❌ Backend error: ${err.message}`, colors.red);
  });

  return backend;
}

function startFrontend() {
  log("🎨 Starting Frontend Development Server...", colors.green);

  // Start frontend server
  const frontend = spawn("npm", ["run", "dev"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  frontend.on("error", (err) => {
    log(`❌ Frontend error: ${err.message}`, colors.red);
  });

  return frontend;
}

function showInstructions() {
  log("\n🎯 Demo Instructions:", colors.bright);
  log("1. Backend API will be available at: http://localhost:3001", colors.cyan);
  log("2. Frontend will be available at: http://localhost:3000", colors.cyan);
  log("3. The frontend is configured to proxy API calls to the backend", colors.cyan);
  log("4. Try the following:", colors.yellow);
  log("   - Open http://localhost:3000 in your browser", colors.yellow);
  log("   - Start a conversation with the AI agent", colors.yellow);
  log('   - Upload a PDF CV using the "Upload CV" button', colors.yellow);
  log("   - Test the error handling by stopping the backend", colors.yellow);
  log("\n💡 Features to test:", colors.bright);
  log("   ✓ Real-time chat interface", colors.green);
  log("   ✓ CV upload with drag-and-drop", colors.green);
  log("   ✓ Error handling and loading states", colors.green);
  log("   ✓ Session management", colors.green);
  log("   ✓ Responsive design", colors.green);
  log("\n🛑 Press Ctrl+C to stop both servers\n", colors.red);
}

async function main() {
  try {
    // Show instructions
    showInstructions();

    // Start backend first
    const backend = startBackend();

    // Wait a bit for backend to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Start frontend
    const frontend = startFrontend();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      log("\n🛑 Shutting down servers...", colors.yellow);
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
  } catch (error) {
    log(`❌ Demo failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
