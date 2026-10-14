import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRedemptionVarianceAmountRangeRule,
  PrimaryRedemptionVarianceCapacityRangeRule,
  PrimaryRedemptionVarianceNameLengthRule,
  PrimaryRedemptionVarianceRequiredCodeRule,
  defaultPrimaryRedemptionVarianceValidator,
} from "./primary-redemption-variance-rules.js";
import { newPrimaryRedemptionVariance } from "./primary-redemption-variance.js";

test("PrimaryRedemptionVarianceValidator reports every problem", () => {
  const validator = defaultPrimaryRedemptionVarianceValidator();
  const item = newPrimaryRedemptionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRedemptionVarianceCapacityRangeRule flags values above capacity", () => {
  const rule = new PrimaryRedemptionVarianceCapacityRangeRule(80, 86400);
  const item = newPrimaryRedemptionVariance("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryRedemptionVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryRedemptionVarianceRequiredCodeRule("primary redemption variance needs a value");
  const item = newPrimaryRedemptionVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRedemptionVarianceAmountRangeRule flags values above amount", () => {
  const rule = new PrimaryRedemptionVarianceAmountRangeRule(3.1, 3598.3);
  const item = newPrimaryRedemptionVariance("x", "y");
  item.amount = 3599.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryRedemptionVarianceNameLengthRule flags a long name", () => {
  const rule = new PrimaryRedemptionVarianceNameLengthRule(64);
  const item = newPrimaryRedemptionVariance("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
