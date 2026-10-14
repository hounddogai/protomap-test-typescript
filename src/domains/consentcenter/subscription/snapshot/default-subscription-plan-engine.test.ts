import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultSubscriptionPlanEngine } from "./default-subscription-plan-engine.js";
import { newDefaultSubscriptionPlan } from "./default-subscription-plan.js";

test("DefaultSubscriptionPlanEngine keeps results within bounds", () => {
  const engine = defaultDefaultSubscriptionPlanEngine(flags.newRegistry());
  const item = newDefaultSubscriptionPlan("code-96", "label-320");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
