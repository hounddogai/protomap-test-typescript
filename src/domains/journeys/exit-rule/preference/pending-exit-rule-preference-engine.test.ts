import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingExitRulePreferenceEngine } from "./pending-exit-rule-preference-engine.js";
import { newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

test("PendingExitRulePreferenceEngine keeps results within bounds", () => {
  const engine = defaultPendingExitRulePreferenceEngine();
  const item = newPendingExitRulePreference("code-688", "name-516");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
