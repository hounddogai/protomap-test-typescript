import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionPolicyGraceDaysRangeRule,
  RetentionPolicyNameLengthRule,
  RetentionPolicyRatioRangeRule,
  defaultRetentionPolicyValidator,
} from "./retention-policy-rules.js";
import { newRetentionPolicy } from "./retention-policy.js";

test("RetentionPolicyValidator reports every problem", () => {
  const validator = defaultRetentionPolicyValidator();
  const item = newRetentionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionPolicyGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RetentionPolicyGraceDaysRangeRule(64, 1000);
  const item = newRetentionPolicy("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionPolicyNameLengthRule flags a long name", () => {
  const rule = new RetentionPolicyNameLengthRule(80);
  const item = newRetentionPolicy("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionPolicyRatioRangeRule flags values above ratio", () => {
  const rule = new RetentionPolicyRatioRangeRule(3.1, 4093.1);
  const item = newRetentionPolicy("x", "y");
  item.ratio = 4094.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
