import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionPlanEngine } from "./mention-plan-engine.js";
import { newMentionPlan } from "./mention-plan.js";

test("MentionPlanEngine keeps results within bounds", () => {
  const engine = defaultMentionPlanEngine(flags.newRegistry());
  const item = newMentionPlan("code-541", "label-349");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
