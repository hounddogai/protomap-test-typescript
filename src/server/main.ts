import "reflect-metadata";
import { ServerCredentials } from "@grpc/grpc-js";
import { configuration } from "../platform/config.js";
import { createApplication } from "../platform/container.js";
import { Logger } from "../platform/logger.js";
import { createServer } from "./server.js";

const config = configuration();
const app = createApplication(config);
const log = app.scope.resolve<Logger>("logger");
const server = createServer(app.scope);
try {
  await new Promise<number>((resolve, reject) => server.bindAsync(config.listen, ServerCredentials.createInsecure(),
    (error, port) => error ? reject(error) : resolve(port)));
  log.info("listening", { address: config.listen });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => server.forceShutdown(), 10_000);
    server.tryShutdown(() => {
      clearTimeout(timer);
      void app.close().catch((error: unknown) => { log.error("shutdown_failed", error); process.exitCode = 1; });
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
} catch (error) {
  server.forceShutdown();
  await app.close();
  throw error;
}
