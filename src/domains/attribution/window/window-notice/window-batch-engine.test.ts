import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowBatchEngine } from "./window-batch-engine.js";
import { newWindowBatch } from "./window-batch.js";

test("WindowBatchEngine keeps results within bounds", () => {
  const engine = defaultWindowBatchEngine();
  const item = newWindowBatch("code-90", "label-334");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
