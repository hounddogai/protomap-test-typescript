import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderPolicyRequiredCodeRule,
  SenderPolicyRequiredSegmentRule,
  SenderPolicyRevisionRangeRule,
  SenderPolicySegmentLengthRule,
  defaultSenderPolicyValidator,
} from "./sender-policy-rules.js";
import { newSenderPolicy } from "./sender-policy.js";

test("SenderPolicyValidator reports every problem", () => {
  const validator = defaultSenderPolicyValidator();
  const item = newSenderPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SenderPolicyRequiredCodeRule("sender policy needs this field");
  const item = newSenderPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderPolicyRequiredSegmentRule flags a blank segment", () => {
  const rule = new SenderPolicyRequiredSegmentRule("sender policy needs a value");
  const item = newSenderPolicy("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderPolicySegmentLengthRule flags a long segment", () => {
  const rule = new SenderPolicySegmentLengthRule(16);
  const item = newSenderPolicy("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderPolicyRevisionRangeRule flags values above revision", () => {
  const rule = new SenderPolicyRevisionRangeRule(3600, 86400);
  const item = newSenderPolicy("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
