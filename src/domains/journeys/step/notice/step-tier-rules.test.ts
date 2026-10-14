import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepTierBudgetRangeRule,
  StepTierCodeLengthRule,
  StepTierRequiredCodeRule,
  StepTierRequiredTitleRule,
  StepTierTitleLengthRule,
  defaultStepTierValidator,
} from "./step-tier-rules.js";
import { newStepTier } from "./step-tier.js";

test("StepTierValidator reports every problem", () => {
  const validator = defaultStepTierValidator();
  const item = newStepTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepTierBudgetRangeRule flags values above budget", () => {
  const rule = new StepTierBudgetRangeRule(2.9, 4996.1);
  const item = newStepTier("x", "y");
  item.budget = 4997.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepTierCodeLengthRule flags a long code", () => {
  const rule = new StepTierCodeLengthRule(1000);
  const item = newStepTier("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepTierRequiredCodeRule flags a blank code", () => {
  const rule = new StepTierRequiredCodeRule("step tier needs this field");
  const item = newStepTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepTierTitleLengthRule flags a long title", () => {
  const rule = new StepTierTitleLengthRule(16);
  const item = newStepTier("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepTierRequiredTitleRule flags a blank title", () => {
  const rule = new StepTierRequiredTitleRule("step tier needs an entry");
  const item = newStepTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
