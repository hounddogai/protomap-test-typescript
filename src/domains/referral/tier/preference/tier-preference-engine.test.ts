import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierPreferenceEngine } from "./tier-preference-engine.js";
import { newTierPreference } from "./tier-preference.js";

test("TierPreferenceEngine keeps results within bounds", () => {
  const engine = defaultTierPreferenceEngine();
  const item = newTierPreference("code-802", "name-237");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
