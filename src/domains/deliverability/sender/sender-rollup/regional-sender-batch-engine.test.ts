import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSenderBatchEngine } from "./regional-sender-batch-engine.js";
import { newRegionalSenderBatch } from "./regional-sender-batch.js";

test("RegionalSenderBatchEngine keeps results within bounds", () => {
  const engine = defaultRegionalSenderBatchEngine();
  const item = newRegionalSenderBatch("code-692", "label-10");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
