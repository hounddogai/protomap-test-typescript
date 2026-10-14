import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleSummaryEngine } from "./bid-rule-summary-engine.js";
import { newBidRuleSummary } from "./bid-rule-summary.js";

test("BidRuleSummaryEngine keeps results within bounds", () => {
  const engine = defaultBidRuleSummaryEngine(flags.newRegistry());
  const item = newBidRuleSummary("code-867", "name-2");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
