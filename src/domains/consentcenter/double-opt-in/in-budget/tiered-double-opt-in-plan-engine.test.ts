import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredDoubleOptInPlanEngine } from "./tiered-double-opt-in-plan-engine.js";
import { newTieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

test("TieredDoubleOptInPlanEngine keeps results within bounds", () => {
  const engine = defaultTieredDoubleOptInPlanEngine(flags.newRegistry());
  const item = newTieredDoubleOptInPlan("code-611", "label-804");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
