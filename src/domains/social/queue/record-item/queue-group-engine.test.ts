import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueGroupEngine } from "./queue-group-engine.js";
import { newQueueGroup } from "./queue-group.js";

test("QueueGroupEngine keeps results within bounds", () => {
  const engine = defaultQueueGroupEngine();
  const item = newQueueGroup("code-162", "label-244");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
