import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRewardRuleScheduleEngine } from "./legacy-reward-rule-schedule-engine.js";
import { newLegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

test("LegacyRewardRuleScheduleEngine keeps results within bounds", () => {
  const engine = defaultLegacyRewardRuleScheduleEngine(flags.newRegistry());
  const item = newLegacyRewardRuleSchedule("code-234", "title-819");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
