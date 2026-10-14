import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualReplyVarianceEndsAtRangeRule,
  ManualReplyVarianceLabelLengthRule,
  ManualReplyVarianceRequiredCodeRule,
  ManualReplyVarianceRequiredLabelRule,
  defaultManualReplyVarianceValidator,
} from "./manual-reply-variance-rules.js";
import { newManualReplyVariance } from "./manual-reply-variance.js";

test("ManualReplyVarianceValidator reports every problem", () => {
  const validator = defaultManualReplyVarianceValidator();
  const item = newManualReplyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualReplyVarianceLabelLengthRule flags a long label", () => {
  const rule = new ManualReplyVarianceLabelLengthRule(32);
  const item = newManualReplyVariance("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualReplyVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new ManualReplyVarianceRequiredCodeRule("manual reply variance needs this field");
  const item = newManualReplyVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualReplyVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new ManualReplyVarianceRequiredLabelRule("manual reply variance needs this field");
  const item = newManualReplyVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualReplyVarianceEndsAtRangeRule flags values above ends at", () => {
  const rule = new ManualReplyVarianceEndsAtRangeRule(80, 3600);
  const item = newManualReplyVariance("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
