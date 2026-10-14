import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueRequestEngine } from "./queue-request-engine.js";
import { newQueueRequest } from "./queue-request.js";

test("QueueRequestEngine keeps results within bounds", () => {
  const engine = defaultQueueRequestEngine();
  const item = newQueueRequest("code-602", "name-825");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
