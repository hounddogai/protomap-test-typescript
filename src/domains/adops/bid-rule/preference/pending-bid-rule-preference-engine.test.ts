import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingBidRulePreferenceEngine } from "./pending-bid-rule-preference-engine.js";
import { newPendingBidRulePreference } from "./pending-bid-rule-preference.js";

test("PendingBidRulePreferenceEngine keeps results within bounds", () => {
  const engine = defaultPendingBidRulePreferenceEngine();
  const item = newPendingBidRulePreference("code-583", "label-592");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
