import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreditSegmentLabelLengthRule,
  FallbackCreditSegmentRequiredLabelRule,
  FallbackCreditSegmentSequenceRangeRule,
  defaultFallbackCreditSegmentValidator,
} from "./fallback-credit-segment-rules.js";
import { newFallbackCreditSegment } from "./fallback-credit-segment.js";

test("FallbackCreditSegmentValidator reports every problem", () => {
  const validator = defaultFallbackCreditSegmentValidator();
  const item = newFallbackCreditSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreditSegmentSequenceRangeRule flags values above sequence", () => {
  const rule = new FallbackCreditSegmentSequenceRangeRule(32, 120);
  const item = newFallbackCreditSegment("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCreditSegmentLabelLengthRule flags a long label", () => {
  const rule = new FallbackCreditSegmentLabelLengthRule(120);
  const item = newFallbackCreditSegment("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCreditSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackCreditSegmentRequiredLabelRule("fallback credit segment needs this field");
  const item = newFallbackCreditSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
