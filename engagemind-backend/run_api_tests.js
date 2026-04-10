#!/usr/bin/env node

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = process.env.PORT || "5003";
const HOST = "127.0.0.1";
const SERVER_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 500;

const env = {
  ...process.env,
  PORT,
  // Keep tests runnable without real email credentials.
  RESEND_API_KEY: process.env.RESEND_API_KEY || "re_test_key",
};

const serverPath = path.join(__dirname, "server.js");
const apiTestsPath = path.join(__dirname, "test_apis.js");

let serverProcess = null;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: HOST, port: Number(PORT), path: "/", method: "GET", timeout: 1500 },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < SERVER_TIMEOUT_MS) {
    if (await isServerUp()) return;
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error(`Server did not become ready on port ${PORT} within ${SERVER_TIMEOUT_MS}ms`);
}

function runApiSuite() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [apiTestsPath], {
      stdio: "inherit",
      env: { ...env, BACKEND_URL: `http://localhost:${PORT}` },
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function shutdownServer() {
  if (!serverProcess || serverProcess.killed) return;
  await new Promise((resolve) => {
    serverProcess.once("exit", () => resolve());
    serverProcess.kill("SIGTERM");
    setTimeout(() => {
      if (!serverProcess.killed) serverProcess.kill("SIGKILL");
      resolve();
    }, 3000);
  });
}

async function main() {
  try {
    serverProcess = spawn(process.execPath, [serverPath], { stdio: "inherit", env });
    serverProcess.on("error", (err) => {
      console.error("Failed to start backend server:", err.message);
      process.exitCode = 1;
    });

    await waitForServer();
    const testCode = await runApiSuite();
    process.exitCode = testCode;
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  } finally {
    await shutdownServer();
  }
}

main();
