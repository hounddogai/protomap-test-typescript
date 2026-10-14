import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleBaselineEngine } from "./bid-rule-baseline-engine.js";
import { newBidRuleBaseline } from "./bid-rule-baseline.js";

test("BidRuleBaselineEngine keeps results within bounds", () => {
  const engine = defaultBidRuleBaselineEngine();
  const item = newBidRuleBaseline("code-302", "name-896");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
