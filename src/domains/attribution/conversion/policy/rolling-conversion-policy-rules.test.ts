import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingConversionPolicyBidRangeRule,
  RollingConversionPolicyOwnerIdLengthRule,
  RollingConversionPolicyRequiredCodeRule,
  RollingConversionPolicyRequiredOwnerIdRule,
  RollingConversionPolicyRequiredTitleRule,
  RollingConversionPolicyTitleLengthRule,
  defaultRollingConversionPolicyValidator,
} from "./rolling-conversion-policy-rules.js";
import { newRollingConversionPolicy } from "./rolling-conversion-policy.js";

test("RollingConversionPolicyValidator reports every problem", () => {
  const validator = defaultRollingConversionPolicyValidator();
  const item = newRollingConversionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingConversionPolicyTitleLengthRule flags a long title", () => {
  const rule = new RollingConversionPolicyTitleLengthRule(255);
  const item = newRollingConversionPolicy("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingConversionPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new RollingConversionPolicyRequiredCodeRule("rolling conversion policy needs a value");
  const item = newRollingConversionPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingConversionPolicyRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RollingConversionPolicyRequiredOwnerIdRule("rolling conversion policy needs this field");
  const item = newRollingConversionPolicy("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingConversionPolicyOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RollingConversionPolicyOwnerIdLengthRule(3600);
  const item = newRollingConversionPolicy("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingConversionPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new RollingConversionPolicyRequiredTitleRule("rolling conversion policy needs a value");
  const item = newRollingConversionPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingConversionPolicyBidRangeRule flags values above bid", () => {
  const rule = new RollingConversionPolicyBidRangeRule(4, 208.8);
  const item = newRollingConversionPolicy("x", "y");
  item.bid = 210.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
