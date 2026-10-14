import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedSubscriptionSummaryEngine } from "./batched-subscription-summary-engine.js";
import { newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("BatchedSubscriptionSummaryEngine keeps results within bounds", () => {
  const engine = defaultBatchedSubscriptionSummaryEngine(flags.newRegistry());
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
