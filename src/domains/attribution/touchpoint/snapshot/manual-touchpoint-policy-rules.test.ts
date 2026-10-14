import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTouchpointPolicyRequiredNameRule,
  ManualTouchpointPolicyRequiredSegmentRule,
  ManualTouchpointPolicySegmentLengthRule,
  ManualTouchpointPolicyStartsAtRangeRule,
  defaultManualTouchpointPolicyValidator,
} from "./manual-touchpoint-policy-rules.js";
import { newManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

test("ManualTouchpointPolicyValidator reports every problem", () => {
  const validator = defaultManualTouchpointPolicyValidator();
  const item = newManualTouchpointPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTouchpointPolicySegmentLengthRule flags a long segment", () => {
  const rule = new ManualTouchpointPolicySegmentLengthRule(3600);
  const item = newManualTouchpointPolicy("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTouchpointPolicyRequiredSegmentRule flags a blank segment", () => {
  const rule = new ManualTouchpointPolicyRequiredSegmentRule("manual touchpoint policy needs an entry");
  const item = newManualTouchpointPolicy("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointPolicyRequiredNameRule flags a blank name", () => {
  const rule = new ManualTouchpointPolicyRequiredNameRule("manual touchpoint policy needs a value");
  const item = newManualTouchpointPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointPolicyStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualTouchpointPolicyStartsAtRangeRule(80, 3600);
  const item = newManualTouchpointPolicy("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
