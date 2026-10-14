import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedPreferenceMappingEngine } from "./weighted-preference-mapping-engine.js";
import { newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

test("WeightedPreferenceMappingEngine keeps results within bounds", () => {
  const engine = defaultWeightedPreferenceMappingEngine();
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
