import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackInviteBaselineCapacityRangeRule,
  FallbackInviteBaselineMarginRangeRule,
  FallbackInviteBaselineNameLengthRule,
  FallbackInviteBaselinePhoneLengthRule,
  FallbackInviteBaselineRequiredCodeRule,
  defaultFallbackInviteBaselineValidator,
} from "./fallback-invite-baseline-rules.js";
import { newFallbackInviteBaseline } from "./fallback-invite-baseline.js";

test("FallbackInviteBaselineValidator reports every problem", () => {
  const validator = defaultFallbackInviteBaselineValidator();
  const item = newFallbackInviteBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackInviteBaselineMarginRangeRule flags values above margin", () => {
  const rule = new FallbackInviteBaselineMarginRangeRule(8.5, 4634.5);
  const item = newFallbackInviteBaseline("x", "y");
  item.margin = 4636;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackInviteBaselineNameLengthRule flags a long name", () => {
  const rule = new FallbackInviteBaselineNameLengthRule(3600);
  const item = newFallbackInviteBaseline("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackInviteBaselineCapacityRangeRule flags values above capacity", () => {
  const rule = new FallbackInviteBaselineCapacityRangeRule(16, 3600);
  const item = newFallbackInviteBaseline("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackInviteBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackInviteBaselineRequiredCodeRule("fallback invite baseline needs this field");
  const item = newFallbackInviteBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInviteBaselinePhoneLengthRule flags a long phone", () => {
  const rule = new FallbackInviteBaselinePhoneLengthRule(64);
  const item = newFallbackInviteBaseline("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
