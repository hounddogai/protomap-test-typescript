import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBounceMilestoneCodeLengthRule,
  ScheduledBounceMilestoneRequiredLocaleRule,
  ScheduledBounceMilestoneThresholdRangeRule,
  defaultScheduledBounceMilestoneValidator,
} from "./scheduled-bounce-milestone-rules.js";
import { newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("ScheduledBounceMilestoneValidator reports every problem", () => {
  const validator = defaultScheduledBounceMilestoneValidator();
  const item = newScheduledBounceMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBounceMilestoneRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledBounceMilestoneRequiredLocaleRule("scheduled bounce milestone needs an entry");
  const item = newScheduledBounceMilestone("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBounceMilestoneCodeLengthRule flags a long code", () => {
  const rule = new ScheduledBounceMilestoneCodeLengthRule(86400);
  const item = newScheduledBounceMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBounceMilestoneThresholdRangeRule flags values above threshold", () => {
  const rule = new ScheduledBounceMilestoneThresholdRangeRule(0.2, 4517.8);
  const item = newScheduledBounceMilestone("x", "y");
  item.threshold = 4519.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
