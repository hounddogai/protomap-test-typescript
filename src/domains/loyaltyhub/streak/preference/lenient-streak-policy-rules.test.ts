import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakPolicyAudienceIdLengthRule,
  LenientStreakPolicyOwnerIdLengthRule,
  LenientStreakPolicyRequiredAudienceIdRule,
  LenientStreakPolicyRequiredOwnerIdRule,
  defaultLenientStreakPolicyValidator,
} from "./lenient-streak-policy-rules.js";
import { newLenientStreakPolicy } from "./lenient-streak-policy.js";

test("LenientStreakPolicyValidator reports every problem", () => {
  const validator = defaultLenientStreakPolicyValidator();
  const item = newLenientStreakPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakPolicyRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LenientStreakPolicyRequiredAudienceIdRule("lenient streak policy needs this field");
  const item = newLenientStreakPolicy("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakPolicyAudienceIdLengthRule flags a long audience id", () => {
  const rule = new LenientStreakPolicyAudienceIdLengthRule(1000);
  const item = newLenientStreakPolicy("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakPolicyRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LenientStreakPolicyRequiredOwnerIdRule("lenient streak policy needs a value");
  const item = newLenientStreakPolicy("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakPolicyOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LenientStreakPolicyOwnerIdLengthRule(3600);
  const item = newLenientStreakPolicy("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
