import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimarySenderPlanEngine } from "./primary-sender-plan-engine.js";
import { newPrimarySenderPlan } from "./primary-sender-plan.js";

test("PrimarySenderPlanEngine keeps results within bounds", () => {
  const engine = defaultPrimarySenderPlanEngine(flags.newRegistry());
  const item = newPrimarySenderPlan("code-920", "label-110");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
