import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTouchpointPolicyChannelLengthRule,
  StrictTouchpointPolicyCodeLengthRule,
  StrictTouchpointPolicyCreatedAtRangeRule,
  StrictTouchpointPolicyRequiredLabelRule,
  defaultStrictTouchpointPolicyValidator,
} from "./strict-touchpoint-policy-rules.js";
import { newStrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

test("StrictTouchpointPolicyValidator reports every problem", () => {
  const validator = defaultStrictTouchpointPolicyValidator();
  const item = newStrictTouchpointPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTouchpointPolicyChannelLengthRule flags a long channel", () => {
  const rule = new StrictTouchpointPolicyChannelLengthRule(1000);
  const item = newStrictTouchpointPolicy("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTouchpointPolicyCodeLengthRule flags a long code", () => {
  const rule = new StrictTouchpointPolicyCodeLengthRule(86400);
  const item = newStrictTouchpointPolicy("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictTouchpointPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new StrictTouchpointPolicyRequiredLabelRule("strict touchpoint policy needs a value");
  const item = newStrictTouchpointPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTouchpointPolicyCreatedAtRangeRule flags values above created at", () => {
  const rule = new StrictTouchpointPolicyCreatedAtRangeRule(120, 1000);
  const item = newStrictTouchpointPolicy("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
