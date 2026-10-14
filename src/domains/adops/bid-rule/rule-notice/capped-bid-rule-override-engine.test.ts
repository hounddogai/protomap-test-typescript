import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedBidRuleOverrideEngine } from "./capped-bid-rule-override-engine.js";
import { newCappedBidRuleOverride } from "./capped-bid-rule-override.js";

test("CappedBidRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultCappedBidRuleOverrideEngine();
  const item = newCappedBidRuleOverride("code-638", "name-506");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
