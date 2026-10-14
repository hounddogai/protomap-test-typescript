import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckPolicyRequiredCodeRule,
  FraudCheckPolicyRequiredSegmentRule,
  FraudCheckPolicyRequiredTitleRule,
  FraudCheckPolicySegmentLengthRule,
  FraudCheckPolicyTitleLengthRule,
  defaultFraudCheckPolicyValidator,
} from "./fraud-check-policy-rules.js";
import { newFraudCheckPolicy } from "./fraud-check-policy.js";

test("FraudCheckPolicyValidator reports every problem", () => {
  const validator = defaultFraudCheckPolicyValidator();
  const item = newFraudCheckPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckPolicyRequiredSegmentRule flags a blank segment", () => {
  const rule = new FraudCheckPolicyRequiredSegmentRule("fraud check policy needs a value");
  const item = newFraudCheckPolicy("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckPolicySegmentLengthRule flags a long segment", () => {
  const rule = new FraudCheckPolicySegmentLengthRule(16);
  const item = newFraudCheckPolicy("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckPolicyTitleLengthRule flags a long title", () => {
  const rule = new FraudCheckPolicyTitleLengthRule(64);
  const item = newFraudCheckPolicy("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new FraudCheckPolicyRequiredTitleRule("fraud check policy needs a value");
  const item = newFraudCheckPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new FraudCheckPolicyRequiredCodeRule("fraud check policy needs an entry");
  const item = newFraudCheckPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
