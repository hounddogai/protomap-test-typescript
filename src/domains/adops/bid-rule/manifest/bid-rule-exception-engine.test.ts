import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleExceptionEngine } from "./bid-rule-exception-engine.js";
import { newBidRuleException } from "./bid-rule-exception.js";

test("BidRuleExceptionEngine keeps results within bounds", () => {
  const engine = defaultBidRuleExceptionEngine();
  const item = newBidRuleException("code-774", "label-97");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
