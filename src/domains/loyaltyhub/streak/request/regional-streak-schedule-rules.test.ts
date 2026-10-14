import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStreakScheduleCampaignRefLengthRule,
  RegionalStreakScheduleLabelLengthRule,
  RegionalStreakScheduleQuantityRangeRule,
  RegionalStreakScheduleRequiredLabelRule,
  RegionalStreakScheduleVersionRangeRule,
  defaultRegionalStreakScheduleValidator,
} from "./regional-streak-schedule-rules.js";
import { newRegionalStreakSchedule } from "./regional-streak-schedule.js";

test("RegionalStreakScheduleValidator reports every problem", () => {
  const validator = defaultRegionalStreakScheduleValidator();
  const item = newRegionalStreakSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStreakScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalStreakScheduleRequiredLabelRule("regional streak schedule needs this field");
  const item = newRegionalStreakSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStreakScheduleVersionRangeRule flags values above version", () => {
  const rule = new RegionalStreakScheduleVersionRangeRule(120, 86400);
  const item = newRegionalStreakSchedule("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStreakScheduleQuantityRangeRule flags values above quantity", () => {
  const rule = new RegionalStreakScheduleQuantityRangeRule(80, 86400);
  const item = newRegionalStreakSchedule("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStreakScheduleLabelLengthRule flags a long label", () => {
  const rule = new RegionalStreakScheduleLabelLengthRule(64);
  const item = newRegionalStreakSchedule("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalStreakScheduleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RegionalStreakScheduleCampaignRefLengthRule(255);
  const item = newRegionalStreakSchedule("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
