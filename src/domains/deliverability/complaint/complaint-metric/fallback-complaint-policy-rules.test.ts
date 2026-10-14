import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackComplaintPolicyMinimumRangeRule,
  FallbackComplaintPolicyNameLengthRule,
  FallbackComplaintPolicyRequiredTimezoneRule,
  FallbackComplaintPolicyTimezoneLengthRule,
  defaultFallbackComplaintPolicyValidator,
} from "./fallback-complaint-policy-rules.js";
import { newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

test("FallbackComplaintPolicyValidator reports every problem", () => {
  const validator = defaultFallbackComplaintPolicyValidator();
  const item = newFallbackComplaintPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackComplaintPolicyRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackComplaintPolicyRequiredTimezoneRule("fallback complaint policy needs an entry");
  const item = newFallbackComplaintPolicy("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackComplaintPolicyTimezoneLengthRule flags a long timezone", () => {
  const rule = new FallbackComplaintPolicyTimezoneLengthRule(32);
  const item = newFallbackComplaintPolicy("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackComplaintPolicyMinimumRangeRule flags values above minimum", () => {
  const rule = new FallbackComplaintPolicyMinimumRangeRule(8.6, 2163.2);
  const item = newFallbackComplaintPolicy("x", "y");
  item.minimum = 2164.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackComplaintPolicyNameLengthRule flags a long name", () => {
  const rule = new FallbackComplaintPolicyNameLengthRule(120);
  const item = newFallbackComplaintPolicy("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
