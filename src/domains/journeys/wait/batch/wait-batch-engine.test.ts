import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitBatchEngine } from "./wait-batch-engine.js";
import { newWaitBatch } from "./wait-batch.js";

test("WaitBatchEngine keeps results within bounds", () => {
  const engine = defaultWaitBatchEngine();
  const item = newWaitBatch("code-611", "title-819");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
