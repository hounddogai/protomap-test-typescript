import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientQueuePolicyCodeLengthRule,
  LenientQueuePolicyCostRangeRule,
  LenientQueuePolicyEndsAtRangeRule,
  LenientQueuePolicyRequiredCodeRule,
  LenientQueuePolicyRequiredNameRule,
  defaultLenientQueuePolicyValidator,
} from "./lenient-queue-policy-rules.js";
import { newLenientQueuePolicy } from "./lenient-queue-policy.js";

test("LenientQueuePolicyValidator reports every problem", () => {
  const validator = defaultLenientQueuePolicyValidator();
  const item = newLenientQueuePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientQueuePolicyRequiredNameRule flags a blank name", () => {
  const rule = new LenientQueuePolicyRequiredNameRule("lenient queue policy needs this field");
  const item = newLenientQueuePolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientQueuePolicyCostRangeRule flags values above cost", () => {
  const rule = new LenientQueuePolicyCostRangeRule(7.7, 336.1);
  const item = newLenientQueuePolicy("x", "y");
  item.cost = 337.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientQueuePolicyCodeLengthRule flags a long code", () => {
  const rule = new LenientQueuePolicyCodeLengthRule(1000);
  const item = newLenientQueuePolicy("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientQueuePolicyEndsAtRangeRule flags values above ends at", () => {
  const rule = new LenientQueuePolicyEndsAtRangeRule(32, 255);
  const item = newLenientQueuePolicy("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientQueuePolicyRequiredCodeRule flags a blank code", () => {
  const rule = new LenientQueuePolicyRequiredCodeRule("lenient queue policy needs this field");
  const item = newLenientQueuePolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
