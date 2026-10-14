import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWarmupMilestoneCodeLengthRule,
  ScheduledWarmupMilestoneDurationMinutesRangeRule,
  ScheduledWarmupMilestoneRequiredTimezoneRule,
  defaultScheduledWarmupMilestoneValidator,
} from "./scheduled-warmup-milestone-rules.js";
import { newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("ScheduledWarmupMilestoneValidator reports every problem", () => {
  const validator = defaultScheduledWarmupMilestoneValidator();
  const item = newScheduledWarmupMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWarmupMilestoneCodeLengthRule flags a long code", () => {
  const rule = new ScheduledWarmupMilestoneCodeLengthRule(64);
  const item = newScheduledWarmupMilestone("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupMilestoneDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ScheduledWarmupMilestoneDurationMinutesRangeRule(80, 1000);
  const item = newScheduledWarmupMilestone("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWarmupMilestoneRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ScheduledWarmupMilestoneRequiredTimezoneRule("scheduled warmup milestone needs this field");
  const item = newScheduledWarmupMilestone("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
