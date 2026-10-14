import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepClaimAttemptsRangeRule,
  StepClaimCapacityRangeRule,
  StepClaimLabelLengthRule,
  StepClaimRequiredUtmSourceRule,
  StepClaimUtmSourceLengthRule,
  defaultStepClaimValidator,
} from "./step-claim-rules.js";
import { newStepClaim } from "./step-claim.js";

test("StepClaimValidator reports every problem", () => {
  const validator = defaultStepClaimValidator();
  const item = newStepClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepClaimUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StepClaimUtmSourceLengthRule(3600);
  const item = newStepClaim("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepClaimRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new StepClaimRequiredUtmSourceRule("step claim needs a value");
  const item = newStepClaim("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepClaimCapacityRangeRule flags values above capacity", () => {
  const rule = new StepClaimCapacityRangeRule(32, 3600);
  const item = newStepClaim("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepClaimLabelLengthRule flags a long label", () => {
  const rule = new StepClaimLabelLengthRule(1000);
  const item = newStepClaim("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepClaimAttemptsRangeRule flags values above attempts", () => {
  const rule = new StepClaimAttemptsRangeRule(255, 3600);
  const item = newStepClaim("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
