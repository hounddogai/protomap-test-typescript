import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledSlaPlanEngine } from "./scheduled-sla-plan-engine.js";
import { newScheduledSlaPlan } from "./scheduled-sla-plan.js";

test("ScheduledSlaPlanEngine keeps results within bounds", () => {
  const engine = defaultScheduledSlaPlanEngine(flags.newRegistry());
  const item = newScheduledSlaPlan("code-936", "name-904");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
