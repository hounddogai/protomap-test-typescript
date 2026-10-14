import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleScheduleEngine } from "./exit-rule-schedule-engine.js";
import { newExitRuleSchedule } from "./exit-rule-schedule.js";

test("ExitRuleScheduleEngine keeps results within bounds", () => {
  const engine = defaultExitRuleScheduleEngine(flags.newRegistry());
  const item = newExitRuleSchedule("code-638", "label-911");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
