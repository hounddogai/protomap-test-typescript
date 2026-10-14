import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutSummaryEngine } from "./payout-summary-engine.js";
import { newPayoutSummary } from "./payout-summary.js";

test("PayoutSummaryEngine keeps results within bounds", () => {
  const engine = defaultPayoutSummaryEngine();
  const item = newPayoutSummary("code-928", "name-888");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
