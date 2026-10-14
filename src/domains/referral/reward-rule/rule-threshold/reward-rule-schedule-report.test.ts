import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleScheduleReport } from "./reward-rule-schedule-report.js";
import { RewardRuleSchedule, newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("RewardRuleScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_349_079);
  const items: RewardRuleSchedule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardRuleSchedule(`reward-rule-schedule-${index}`, "sample"));
  }
  const report = buildRewardRuleScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
