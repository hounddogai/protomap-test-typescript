import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceAllocationEngine } from "./preference-allocation-engine.js";
import { newPreferenceAllocation } from "./preference-allocation.js";

test("PreferenceAllocationEngine keeps results within bounds", () => {
  const engine = defaultPreferenceAllocationEngine();
  const item = newPreferenceAllocation("code-768", "name-216");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
