import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultBidRuleSummaryEngine } from "./default-bid-rule-summary-engine.js";
import { newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

test("DefaultBidRuleSummaryEngine keeps results within bounds", () => {
  const engine = defaultDefaultBidRuleSummaryEngine(flags.newRegistry());
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
