import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierPlanEngine } from "./tier-plan-engine.js";
import { newTierPlan } from "./tier-plan.js";

test("TierPlanEngine keeps results within bounds", () => {
  const engine = defaultTierPlanEngine(flags.newRegistry());
  const item = newTierPlan("code-422", "label-453");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
