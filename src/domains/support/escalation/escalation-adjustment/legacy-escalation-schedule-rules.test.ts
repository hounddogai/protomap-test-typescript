import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEscalationScheduleRequiredAudienceIdRule,
  LegacyEscalationScheduleWeightRangeRule,
  defaultLegacyEscalationScheduleValidator,
} from "./legacy-escalation-schedule-rules.js";
import { newLegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

test("LegacyEscalationScheduleValidator reports every problem", () => {
  const validator = defaultLegacyEscalationScheduleValidator();
  const item = newLegacyEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEscalationScheduleWeightRangeRule flags values above weight", () => {
  const rule = new LegacyEscalationScheduleWeightRangeRule(0.8, 1553.4);
  const item = newLegacyEscalationSchedule("x", "y");
  item.weight = 1554.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEscalationScheduleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LegacyEscalationScheduleRequiredAudienceIdRule("legacy escalation schedule needs this field");
  const item = newLegacyEscalationSchedule("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
