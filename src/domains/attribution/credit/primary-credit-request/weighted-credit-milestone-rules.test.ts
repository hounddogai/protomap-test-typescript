import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCreditMilestoneCodeLengthRule,
  WeightedCreditMilestoneLimitRangeRule,
  WeightedCreditMilestoneRequiredOwnerIdRule,
  defaultWeightedCreditMilestoneValidator,
} from "./weighted-credit-milestone-rules.js";
import { newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

test("WeightedCreditMilestoneValidator reports every problem", () => {
  const validator = defaultWeightedCreditMilestoneValidator();
  const item = newWeightedCreditMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCreditMilestoneCodeLengthRule flags a long code", () => {
  const rule = new WeightedCreditMilestoneCodeLengthRule(86400);
  const item = newWeightedCreditMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreditMilestoneRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedCreditMilestoneRequiredOwnerIdRule("weighted credit milestone needs a value");
  const item = newWeightedCreditMilestone("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCreditMilestoneLimitRangeRule flags values above limit", () => {
  const rule = new WeightedCreditMilestoneLimitRangeRule(120, 3600);
  const item = newWeightedCreditMilestone("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
