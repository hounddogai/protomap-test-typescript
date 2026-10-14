import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleScheduleEngine } from "./reward-rule-schedule-engine.js";
import { newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("RewardRuleScheduleEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleScheduleEngine(flags.newRegistry());
  const item = newRewardRuleSchedule("code-602", "name-349");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
