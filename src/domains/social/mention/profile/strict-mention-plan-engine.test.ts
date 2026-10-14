import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictMentionPlanEngine } from "./strict-mention-plan-engine.js";
import { newStrictMentionPlan } from "./strict-mention-plan.js";

test("StrictMentionPlanEngine keeps results within bounds", () => {
  const engine = defaultStrictMentionPlanEngine(flags.newRegistry());
  const item = newStrictMentionPlan("code-951", "label-766");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
