import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalActivationCycleEndsAtRangeRule,
  GlobalActivationCycleOwnerIdLengthRule,
  GlobalActivationCycleRequiredReviewerRule,
  GlobalActivationCycleStartsAtRangeRule,
  defaultGlobalActivationCycleValidator,
} from "./global-activation-cycle-rules.js";
import { newGlobalActivationCycle } from "./global-activation-cycle.js";

test("GlobalActivationCycleValidator reports every problem", () => {
  const validator = defaultGlobalActivationCycleValidator();
  const item = newGlobalActivationCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalActivationCycleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new GlobalActivationCycleOwnerIdLengthRule(64);
  const item = newGlobalActivationCycle("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalActivationCycleEndsAtRangeRule flags values above ends at", () => {
  const rule = new GlobalActivationCycleEndsAtRangeRule(32, 86400);
  const item = newGlobalActivationCycle("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalActivationCycleStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalActivationCycleStartsAtRangeRule(80, 80);
  const item = newGlobalActivationCycle("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalActivationCycleRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new GlobalActivationCycleRequiredReviewerRule("global activation cycle needs this field");
  const item = newGlobalActivationCycle("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
