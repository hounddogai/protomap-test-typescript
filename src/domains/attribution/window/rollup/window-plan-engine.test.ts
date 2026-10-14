import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowPlanEngine } from "./window-plan-engine.js";
import { newWindowPlan } from "./window-plan.js";

test("WindowPlanEngine keeps results within bounds", () => {
  const engine = defaultWindowPlanEngine(flags.newRegistry());
  const item = newWindowPlan("code-112", "label-928");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
