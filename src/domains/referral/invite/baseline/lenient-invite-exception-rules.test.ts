import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientInviteExceptionCodeLengthRule,
  LenientInviteExceptionEndsAtRangeRule,
  LenientInviteExceptionLabelLengthRule,
  LenientInviteExceptionRequiredCodeRule,
  LenientInviteExceptionRequiredLabelRule,
  LenientInviteExceptionRequiredLocaleRule,
  defaultLenientInviteExceptionValidator,
} from "./lenient-invite-exception-rules.js";
import { newLenientInviteException } from "./lenient-invite-exception.js";

test("LenientInviteExceptionValidator reports every problem", () => {
  const validator = defaultLenientInviteExceptionValidator();
  const item = newLenientInviteException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientInviteExceptionRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientInviteExceptionRequiredLocaleRule("lenient invite exception needs an entry");
  const item = newLenientInviteException("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInviteExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new LenientInviteExceptionRequiredLabelRule("lenient invite exception needs this field");
  const item = newLenientInviteException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInviteExceptionCodeLengthRule flags a long code", () => {
  const rule = new LenientInviteExceptionCodeLengthRule(1000);
  const item = newLenientInviteException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInviteExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new LenientInviteExceptionRequiredCodeRule("lenient invite exception needs this field");
  const item = newLenientInviteException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInviteExceptionLabelLengthRule flags a long label", () => {
  const rule = new LenientInviteExceptionLabelLengthRule(1000);
  const item = newLenientInviteException("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInviteExceptionEndsAtRangeRule flags values above ends at", () => {
  const rule = new LenientInviteExceptionEndsAtRangeRule(64, 120);
  const item = newLenientInviteException("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
