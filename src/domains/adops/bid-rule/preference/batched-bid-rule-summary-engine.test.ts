import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedBidRuleSummaryEngine } from "./batched-bid-rule-summary-engine.js";
import { newBatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

test("BatchedBidRuleSummaryEngine keeps results within bounds", () => {
  const engine = defaultBatchedBidRuleSummaryEngine(flags.newRegistry());
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
