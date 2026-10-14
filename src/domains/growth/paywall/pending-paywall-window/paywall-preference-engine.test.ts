import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallPreferenceEngine } from "./paywall-preference-engine.js";
import { newPaywallPreference } from "./paywall-preference.js";

test("PaywallPreferenceEngine keeps results within bounds", () => {
  const engine = defaultPaywallPreferenceEngine();
  const item = newPaywallPreference("code-610", "title-898");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
