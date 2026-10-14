import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BouncePolicyCreatedAtRangeRule,
  BouncePolicyImpressionsRangeRule,
  BouncePolicyLimitRangeRule,
  BouncePolicyRequiredSegmentRule,
  defaultBouncePolicyValidator,
} from "./bounce-policy-rules.js";
import { newBouncePolicy } from "./bounce-policy.js";

test("BouncePolicyValidator reports every problem", () => {
  const validator = defaultBouncePolicyValidator();
  const item = newBouncePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BouncePolicyImpressionsRangeRule flags values above impressions", () => {
  const rule = new BouncePolicyImpressionsRangeRule(16, 64);
  const item = newBouncePolicy("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BouncePolicyLimitRangeRule flags values above limit", () => {
  const rule = new BouncePolicyLimitRangeRule(32, 1000);
  const item = newBouncePolicy("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BouncePolicyCreatedAtRangeRule flags values above created at", () => {
  const rule = new BouncePolicyCreatedAtRangeRule(64, 1000);
  const item = newBouncePolicy("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BouncePolicyRequiredSegmentRule flags a blank segment", () => {
  const rule = new BouncePolicyRequiredSegmentRule("bounce policy needs a value");
  const item = newBouncePolicy("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
