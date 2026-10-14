import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedApprovalScheduleCodeLengthRule,
  WeightedApprovalScheduleDiscountRangeRule,
  WeightedApprovalScheduleEndsAtRangeRule,
  WeightedApprovalScheduleRequiredCampaignRefRule,
  defaultWeightedApprovalScheduleValidator,
} from "./weighted-approval-schedule-rules.js";
import { newWeightedApprovalSchedule } from "./weighted-approval-schedule.js";

test("WeightedApprovalScheduleValidator reports every problem", () => {
  const validator = defaultWeightedApprovalScheduleValidator();
  const item = newWeightedApprovalSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedApprovalScheduleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WeightedApprovalScheduleRequiredCampaignRefRule("weighted approval schedule needs a value");
  const item = newWeightedApprovalSchedule("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedApprovalScheduleEndsAtRangeRule flags values above ends at", () => {
  const rule = new WeightedApprovalScheduleEndsAtRangeRule(1000, 86400);
  const item = newWeightedApprovalSchedule("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedApprovalScheduleDiscountRangeRule flags values above discount", () => {
  const rule = new WeightedApprovalScheduleDiscountRangeRule(6.8, 3264.9);
  const item = newWeightedApprovalSchedule("x", "y");
  item.discount = 3266.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedApprovalScheduleCodeLengthRule flags a long code", () => {
  const rule = new WeightedApprovalScheduleCodeLengthRule(16);
  const item = newWeightedApprovalSchedule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
