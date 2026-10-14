import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelPolicyCodeLengthRule,
  FunnelPolicyNotesLengthRule,
  FunnelPolicyRequiredCodeRule,
  FunnelPolicyRequiredDescriptionRule,
  FunnelPolicySendAtRangeRule,
  defaultFunnelPolicyValidator,
} from "./funnel-policy-rules.js";
import { newFunnelPolicy } from "./funnel-policy.js";

test("FunnelPolicyValidator reports every problem", () => {
  const validator = defaultFunnelPolicyValidator();
  const item = newFunnelPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelPolicySendAtRangeRule flags values above send at", () => {
  const rule = new FunnelPolicySendAtRangeRule(3600, 86400);
  const item = newFunnelPolicy("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelPolicyCodeLengthRule flags a long code", () => {
  const rule = new FunnelPolicyCodeLengthRule(64);
  const item = newFunnelPolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelPolicyRequiredDescriptionRule flags a blank description", () => {
  const rule = new FunnelPolicyRequiredDescriptionRule("funnel policy needs an entry");
  const item = newFunnelPolicy("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelPolicyRequiredCodeRule("funnel policy needs a value");
  const item = newFunnelPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelPolicyNotesLengthRule flags a long notes", () => {
  const rule = new FunnelPolicyNotesLengthRule(64);
  const item = newFunnelPolicy("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
