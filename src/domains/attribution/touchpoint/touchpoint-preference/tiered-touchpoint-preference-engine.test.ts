import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredTouchpointPreferenceEngine } from "./tiered-touchpoint-preference-engine.js";
import { newTieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

test("TieredTouchpointPreferenceEngine keeps results within bounds", () => {
  const engine = defaultTieredTouchpointPreferenceEngine();
  const item = newTieredTouchpointPreference("code-980", "name-617");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
