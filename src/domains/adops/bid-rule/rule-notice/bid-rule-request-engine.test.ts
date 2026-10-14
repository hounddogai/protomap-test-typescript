import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleRequestEngine } from "./bid-rule-request-engine.js";
import { newBidRuleRequest } from "./bid-rule-request.js";

test("BidRuleRequestEngine keeps results within bounds", () => {
  const engine = defaultBidRuleRequestEngine();
  const item = newBidRuleRequest("code-308", "label-548");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
