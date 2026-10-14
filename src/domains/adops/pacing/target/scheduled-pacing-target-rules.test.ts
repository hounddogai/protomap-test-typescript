import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPacingTargetClicksRangeRule,
  ScheduledPacingTargetOpenRateRangeRule,
  ScheduledPacingTargetRequiredTitleRule,
  ScheduledPacingTargetTitleLengthRule,
  defaultScheduledPacingTargetValidator,
} from "./scheduled-pacing-target-rules.js";
import { newScheduledPacingTarget } from "./scheduled-pacing-target.js";

test("ScheduledPacingTargetValidator reports every problem", () => {
  const validator = defaultScheduledPacingTargetValidator();
  const item = newScheduledPacingTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPacingTargetRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledPacingTargetRequiredTitleRule("scheduled pacing target needs a value");
  const item = newScheduledPacingTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPacingTargetClicksRangeRule flags values above clicks", () => {
  const rule = new ScheduledPacingTargetClicksRangeRule(120, 1000);
  const item = newScheduledPacingTarget("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPacingTargetTitleLengthRule flags a long title", () => {
  const rule = new ScheduledPacingTargetTitleLengthRule(64);
  const item = newScheduledPacingTarget("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPacingTargetOpenRateRangeRule flags values above open rate", () => {
  const rule = new ScheduledPacingTargetOpenRateRangeRule(3, 452.7);
  const item = newScheduledPacingTarget("x", "y");
  item.openRate = 454.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
