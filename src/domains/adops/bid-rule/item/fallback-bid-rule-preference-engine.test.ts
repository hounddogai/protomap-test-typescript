import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackBidRulePreferenceEngine } from "./fallback-bid-rule-preference-engine.js";
import { newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("FallbackBidRulePreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackBidRulePreferenceEngine();
  const item = newFallbackBidRulePreference("code-93", "name-687");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
