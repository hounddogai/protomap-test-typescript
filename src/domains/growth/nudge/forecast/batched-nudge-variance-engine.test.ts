import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedNudgeVarianceEngine } from "./batched-nudge-variance-engine.js";
import { newBatchedNudgeVariance } from "./batched-nudge-variance.js";

test("BatchedNudgeVarianceEngine keeps results within bounds", () => {
  const engine = defaultBatchedNudgeVarianceEngine();
  const item = newBatchedNudgeVariance("code-649", "label-628");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
