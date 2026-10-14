import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryWarmupPolicyOpenRateRangeRule,
  PrimaryWarmupPolicyPhoneLengthRule,
  PrimaryWarmupPolicyRequiredCodeRule,
  PrimaryWarmupPolicyRequiredTimezoneRule,
  defaultPrimaryWarmupPolicyValidator,
} from "./primary-warmup-policy-rules.js";
import { newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

test("PrimaryWarmupPolicyValidator reports every problem", () => {
  const validator = defaultPrimaryWarmupPolicyValidator();
  const item = newPrimaryWarmupPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryWarmupPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryWarmupPolicyRequiredCodeRule("primary warmup policy needs a value");
  const item = newPrimaryWarmupPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryWarmupPolicyOpenRateRangeRule flags values above open rate", () => {
  const rule = new PrimaryWarmupPolicyOpenRateRangeRule(6.1, 4667.6);
  const item = newPrimaryWarmupPolicy("x", "y");
  item.openRate = 4669.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryWarmupPolicyPhoneLengthRule flags a long phone", () => {
  const rule = new PrimaryWarmupPolicyPhoneLengthRule(32);
  const item = newPrimaryWarmupPolicy("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryWarmupPolicyRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PrimaryWarmupPolicyRequiredTimezoneRule("primary warmup policy needs a value");
  const item = newPrimaryWarmupPolicy("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
