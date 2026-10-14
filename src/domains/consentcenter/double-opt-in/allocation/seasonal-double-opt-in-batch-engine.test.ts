import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalDoubleOptInBatchEngine } from "./seasonal-double-opt-in-batch-engine.js";
import { newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

test("SeasonalDoubleOptInBatchEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDoubleOptInBatchEngine();
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
