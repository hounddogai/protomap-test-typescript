import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedWindowBatchEngine } from "./batched-window-batch-engine.js";
import { newBatchedWindowBatch } from "./batched-window-batch.js";

test("BatchedWindowBatchEngine keeps results within bounds", () => {
  const engine = defaultBatchedWindowBatchEngine(flags.newRegistry());
  const item = newBatchedWindowBatch("code-481", "label-798");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
