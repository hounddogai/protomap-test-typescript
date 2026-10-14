import "reflect-metadata";
/**
 * Check all generated application modules as one composition root.
 */

import { createApplication } from "../platform/container.js";
import { createServer } from "./server.js";
import { test } from "node:test";

test("every domain resolves its handlers and registers without collisions", async () => {
  const app = createApplication({ databaseUrl: "postgresql://localhost/acme", listen: "127.0.0.1:0",
    mesh: "127.0.0.1:1", tenant: "test", serviceToken: "test" });
  try { const server = createServer(app.scope); server.forceShutdown(); }
  finally { await app.close(); }
});
