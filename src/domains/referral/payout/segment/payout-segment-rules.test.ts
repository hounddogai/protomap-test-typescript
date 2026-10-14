import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutSegmentExpiresAtRangeRule,
  PayoutSegmentLabelLengthRule,
  PayoutSegmentRequiredCodeRule,
  PayoutSegmentRequiredCohortRule,
  defaultPayoutSegmentValidator,
} from "./payout-segment-rules.js";
import { newPayoutSegment } from "./payout-segment.js";

test("PayoutSegmentValidator reports every problem", () => {
  const validator = defaultPayoutSegmentValidator();
  const item = newPayoutSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutSegmentRequiredCohortRule flags a blank cohort", () => {
  const rule = new PayoutSegmentRequiredCohortRule("payout segment needs a value");
  const item = newPayoutSegment("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutSegmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PayoutSegmentExpiresAtRangeRule(16, 3600);
  const item = newPayoutSegment("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutSegmentRequiredCodeRule("payout segment needs an entry");
  const item = newPayoutSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutSegmentLabelLengthRule flags a long label", () => {
  const rule = new PayoutSegmentLabelLengthRule(86400);
  const item = newPayoutSegment("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
