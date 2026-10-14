import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferencePlanEngine } from "./preference-plan-engine.js";
import { newPreferencePlan } from "./preference-plan.js";

test("PreferencePlanEngine keeps results within bounds", () => {
  const engine = defaultPreferencePlanEngine();
  const item = newPreferencePlan("code-886", "label-120");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
