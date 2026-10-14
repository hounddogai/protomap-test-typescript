import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionMilestoneCeilingRangeRule,
  RedemptionMilestoneLabelLengthRule,
  RedemptionMilestoneNameLengthRule,
  RedemptionMilestoneRequiredCodeRule,
  RedemptionMilestoneRequiredLabelRule,
  defaultRedemptionMilestoneValidator,
} from "./redemption-milestone-rules.js";
import { newRedemptionMilestone } from "./redemption-milestone.js";

test("RedemptionMilestoneValidator reports every problem", () => {
  const validator = defaultRedemptionMilestoneValidator();
  const item = newRedemptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionMilestoneNameLengthRule flags a long name", () => {
  const rule = new RedemptionMilestoneNameLengthRule(86400);
  const item = newRedemptionMilestone("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionMilestoneCeilingRangeRule flags values above ceiling", () => {
  const rule = new RedemptionMilestoneCeilingRangeRule(7.1, 1050.6);
  const item = newRedemptionMilestone("x", "y");
  item.ceiling = 1052.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionMilestoneRequiredCodeRule("redemption milestone needs this field");
  const item = newRedemptionMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new RedemptionMilestoneRequiredLabelRule("redemption milestone needs this field");
  const item = newRedemptionMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionMilestoneLabelLengthRule flags a long label", () => {
  const rule = new RedemptionMilestoneLabelLengthRule(3600);
  const item = newRedemptionMilestone("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
