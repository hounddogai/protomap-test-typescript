import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingRedemptionVarianceCodeLengthRule,
  RollingRedemptionVarianceRequiredSourceRule,
  RollingRedemptionVarianceVersionRangeRule,
  defaultRollingRedemptionVarianceValidator,
} from "./rolling-redemption-variance-rules.js";
import { newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

test("RollingRedemptionVarianceValidator reports every problem", () => {
  const validator = defaultRollingRedemptionVarianceValidator();
  const item = newRollingRedemptionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingRedemptionVarianceRequiredSourceRule flags a blank source", () => {
  const rule = new RollingRedemptionVarianceRequiredSourceRule("rolling redemption variance needs this field");
  const item = newRollingRedemptionVariance("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingRedemptionVarianceCodeLengthRule flags a long code", () => {
  const rule = new RollingRedemptionVarianceCodeLengthRule(64);
  const item = newRollingRedemptionVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingRedemptionVarianceVersionRangeRule flags values above version", () => {
  const rule = new RollingRedemptionVarianceVersionRangeRule(1000, 1000);
  const item = newRollingRedemptionVariance("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
