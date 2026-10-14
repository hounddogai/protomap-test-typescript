import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedNudgeSummaryEngine } from "./batched-nudge-summary-engine.js";
import { newBatchedNudgeSummary } from "./batched-nudge-summary.js";

test("BatchedNudgeSummaryEngine keeps results within bounds", () => {
  const engine = defaultBatchedNudgeSummaryEngine(flags.newRegistry());
  const item = newBatchedNudgeSummary("code-513", "label-522");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
