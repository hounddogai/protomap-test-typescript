import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightBatchEngine } from "./insight-batch-engine.js";
import { newInsightBatch } from "./insight-batch.js";

test("InsightBatchEngine keeps results within bounds", () => {
  const engine = defaultInsightBatchEngine();
  const item = newInsightBatch("code-185", "name-871");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
