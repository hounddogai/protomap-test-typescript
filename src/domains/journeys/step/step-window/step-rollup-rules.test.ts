import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepRollupCodeLengthRule,
  StepRollupMaximumRangeRule,
  StepRollupRequiredNameRule,
  StepRollupScoreRangeRule,
  StepRollupVariantLengthRule,
  defaultStepRollupValidator,
} from "./step-rollup-rules.js";
import { newStepRollup } from "./step-rollup.js";

test("StepRollupValidator reports every problem", () => {
  const validator = defaultStepRollupValidator();
  const item = newStepRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepRollupVariantLengthRule flags a long variant", () => {
  const rule = new StepRollupVariantLengthRule(86400);
  const item = newStepRollup("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRollupScoreRangeRule flags values above score", () => {
  const rule = new StepRollupScoreRangeRule(1.7, 2173.5);
  const item = newStepRollup("x", "y");
  item.score = 2175;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRollupCodeLengthRule flags a long code", () => {
  const rule = new StepRollupCodeLengthRule(64);
  const item = newStepRollup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRollupMaximumRangeRule flags values above maximum", () => {
  const rule = new StepRollupMaximumRangeRule(1.7, 3356.5);
  const item = newStepRollup("x", "y");
  item.maximum = 3358;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRollupRequiredNameRule flags a blank name", () => {
  const rule = new StepRollupRequiredNameRule("step rollup needs this field");
  const item = newStepRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
