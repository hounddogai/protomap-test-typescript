import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleEstimateEngine } from "./bid-rule-estimate-engine.js";
import { newBidRuleEstimate } from "./bid-rule-estimate.js";

test("BidRuleEstimateEngine keeps results within bounds", () => {
  const engine = defaultBidRuleEstimateEngine(flags.newRegistry());
  const item = newBidRuleEstimate("code-568", "name-461");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
