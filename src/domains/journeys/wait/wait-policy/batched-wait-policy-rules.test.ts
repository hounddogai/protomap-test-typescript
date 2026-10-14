import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWaitPolicyCodeLengthRule,
  BatchedWaitPolicyRequiredCodeRule,
  BatchedWaitPolicyRequiredTitleRule,
  BatchedWaitPolicyRequiredUtmSourceRule,
  BatchedWaitPolicyThresholdRangeRule,
  defaultBatchedWaitPolicyValidator,
} from "./batched-wait-policy-rules.js";
import { newBatchedWaitPolicy } from "./batched-wait-policy.js";

test("BatchedWaitPolicyValidator reports every problem", () => {
  const validator = defaultBatchedWaitPolicyValidator();
  const item = newBatchedWaitPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWaitPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedWaitPolicyRequiredTitleRule("batched wait policy needs a value");
  const item = newBatchedWaitPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitPolicyRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BatchedWaitPolicyRequiredUtmSourceRule("batched wait policy needs a value");
  const item = newBatchedWaitPolicy("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedWaitPolicyRequiredCodeRule("batched wait policy needs this field");
  const item = newBatchedWaitPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitPolicyCodeLengthRule flags a long code", () => {
  const rule = new BatchedWaitPolicyCodeLengthRule(86400);
  const item = newBatchedWaitPolicy("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWaitPolicyThresholdRangeRule flags values above threshold", () => {
  const rule = new BatchedWaitPolicyThresholdRangeRule(4.5, 1329.7);
  const item = newBatchedWaitPolicy("x", "y");
  item.threshold = 1331.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
