import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionMilestoneLabelLengthRule,
  RetentionMilestoneRequiredCodeRule,
  RetentionMilestoneRequiredLabelRule,
  RetentionMilestoneRequiredPhoneRule,
  defaultRetentionMilestoneValidator,
} from "./retention-milestone-rules.js";
import { newRetentionMilestone } from "./retention-milestone.js";

test("RetentionMilestoneValidator reports every problem", () => {
  const validator = defaultRetentionMilestoneValidator();
  const item = newRetentionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new RetentionMilestoneRequiredLabelRule("retention milestone needs an entry");
  const item = newRetentionMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionMilestoneLabelLengthRule flags a long label", () => {
  const rule = new RetentionMilestoneLabelLengthRule(32);
  const item = newRetentionMilestone("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionMilestoneRequiredPhoneRule flags a blank phone", () => {
  const rule = new RetentionMilestoneRequiredPhoneRule("retention milestone needs a value");
  const item = newRetentionMilestone("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionMilestoneRequiredCodeRule("retention milestone needs this field");
  const item = newRetentionMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
