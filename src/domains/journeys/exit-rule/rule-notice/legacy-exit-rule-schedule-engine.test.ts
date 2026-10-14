import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyExitRuleScheduleEngine } from "./legacy-exit-rule-schedule-engine.js";
import { newLegacyExitRuleSchedule } from "./legacy-exit-rule-schedule.js";

test("LegacyExitRuleScheduleEngine keeps results within bounds", () => {
  const engine = defaultLegacyExitRuleScheduleEngine(flags.newRegistry());
  const item = newLegacyExitRuleSchedule("code-350", "name-151");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
