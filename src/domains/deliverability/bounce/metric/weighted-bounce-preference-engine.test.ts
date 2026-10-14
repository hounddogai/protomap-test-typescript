import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedBouncePreferenceEngine } from "./weighted-bounce-preference-engine.js";
import { newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("WeightedBouncePreferenceEngine keeps results within bounds", () => {
  const engine = defaultWeightedBouncePreferenceEngine();
  const item = newWeightedBouncePreference("code-573", "name-298");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
