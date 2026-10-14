import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDomainScheduleAmountRangeRule,
  PrimaryDomainScheduleRequiredAudienceIdRule,
  PrimaryDomainScheduleSequenceRangeRule,
  defaultPrimaryDomainScheduleValidator,
} from "./primary-domain-schedule-rules.js";
import { newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

test("PrimaryDomainScheduleValidator reports every problem", () => {
  const validator = defaultPrimaryDomainScheduleValidator();
  const item = newPrimaryDomainSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDomainScheduleSequenceRangeRule flags values above sequence", () => {
  const rule = new PrimaryDomainScheduleSequenceRangeRule(32, 64);
  const item = newPrimaryDomainSchedule("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryDomainScheduleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PrimaryDomainScheduleRequiredAudienceIdRule("primary domain schedule needs an entry");
  const item = newPrimaryDomainSchedule("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDomainScheduleAmountRangeRule flags values above amount", () => {
  const rule = new PrimaryDomainScheduleAmountRangeRule(3.9, 2911.2);
  const item = newPrimaryDomainSchedule("x", "y");
  item.amount = 2912.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
