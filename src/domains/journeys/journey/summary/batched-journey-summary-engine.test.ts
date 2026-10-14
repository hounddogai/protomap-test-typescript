import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedJourneySummaryEngine } from "./batched-journey-summary-engine.js";
import { newBatchedJourneySummary } from "./batched-journey-summary.js";

test("BatchedJourneySummaryEngine keeps results within bounds", () => {
  const engine = defaultBatchedJourneySummaryEngine(flags.newRegistry());
  const item = newBatchedJourneySummary("code-922", "title-7");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
