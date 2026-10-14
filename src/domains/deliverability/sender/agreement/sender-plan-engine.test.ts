import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderPlanEngine } from "./sender-plan-engine.js";
import { newSenderPlan } from "./sender-plan.js";

test("SenderPlanEngine keeps results within bounds", () => {
  const engine = defaultSenderPlanEngine(flags.newRegistry());
  const item = newSenderPlan("code-325", "title-458");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
