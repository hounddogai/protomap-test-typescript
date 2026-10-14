import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedSenderRollupEngine } from "./batched-sender-rollup-engine.js";
import { newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("BatchedSenderRollupEngine keeps results within bounds", () => {
  const engine = defaultBatchedSenderRollupEngine();
  const item = newBatchedSenderRollup("code-667", "label-530");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
