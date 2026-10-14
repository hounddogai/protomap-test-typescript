import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualNudgeBatchEngine } from "./manual-nudge-batch-engine.js";
import { newManualNudgeBatch } from "./manual-nudge-batch.js";

test("ManualNudgeBatchEngine keeps results within bounds", () => {
  const engine = defaultManualNudgeBatchEngine();
  const item = newManualNudgeBatch("code-240", "label-980");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
