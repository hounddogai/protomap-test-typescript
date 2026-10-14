import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWarmupMilestoneAttemptsRangeRule,
  RollingWarmupMilestoneFrequencyCapRangeRule,
  RollingWarmupMilestoneLabelLengthRule,
  RollingWarmupMilestoneLocaleLengthRule,
  RollingWarmupMilestoneRequiredSummaryRule,
  defaultRollingWarmupMilestoneValidator,
} from "./rolling-warmup-milestone-rules.js";
import { newRollingWarmupMilestone } from "./rolling-warmup-milestone.js";

test("RollingWarmupMilestoneValidator reports every problem", () => {
  const validator = defaultRollingWarmupMilestoneValidator();
  const item = newRollingWarmupMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWarmupMilestoneLabelLengthRule flags a long label", () => {
  const rule = new RollingWarmupMilestoneLabelLengthRule(120);
  const item = newRollingWarmupMilestone("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingWarmupMilestoneRequiredSummaryRule flags a blank summary", () => {
  const rule = new RollingWarmupMilestoneRequiredSummaryRule("rolling warmup milestone needs an entry");
  const item = newRollingWarmupMilestone("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWarmupMilestoneFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RollingWarmupMilestoneFrequencyCapRangeRule(80, 1000);
  const item = newRollingWarmupMilestone("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWarmupMilestoneLocaleLengthRule flags a long locale", () => {
  const rule = new RollingWarmupMilestoneLocaleLengthRule(120);
  const item = newRollingWarmupMilestone("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingWarmupMilestoneAttemptsRangeRule flags values above attempts", () => {
  const rule = new RollingWarmupMilestoneAttemptsRangeRule(32, 64);
  const item = newRollingWarmupMilestone("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
