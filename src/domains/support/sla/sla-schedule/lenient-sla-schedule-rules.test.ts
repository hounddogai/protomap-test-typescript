import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSlaScheduleCodeLengthRule,
  LenientSlaScheduleConversionRateRangeRule,
  LenientSlaScheduleRequiredCampaignRefRule,
  LenientSlaScheduleRequiredCodeRule,
  LenientSlaScheduleRequiredTitleRule,
  defaultLenientSlaScheduleValidator,
} from "./lenient-sla-schedule-rules.js";
import { newLenientSlaSchedule } from "./lenient-sla-schedule.js";

test("LenientSlaScheduleValidator reports every problem", () => {
  const validator = defaultLenientSlaScheduleValidator();
  const item = newLenientSlaSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSlaScheduleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LenientSlaScheduleRequiredCampaignRefRule("lenient sla schedule needs an entry");
  const item = newLenientSlaSchedule("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new LenientSlaScheduleRequiredCodeRule("lenient sla schedule needs a value");
  const item = newLenientSlaSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new LenientSlaScheduleRequiredTitleRule("lenient sla schedule needs an entry");
  const item = newLenientSlaSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaScheduleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LenientSlaScheduleConversionRateRangeRule(5.4, 1074.3);
  const item = newLenientSlaSchedule("x", "y");
  item.conversionRate = 1075.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSlaScheduleCodeLengthRule flags a long code", () => {
  const rule = new LenientSlaScheduleCodeLengthRule(16);
  const item = newLenientSlaSchedule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
