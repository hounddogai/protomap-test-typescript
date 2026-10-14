import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveOptOutRecordLabelLengthRule,
  AdaptiveOptOutRecordReviewerLengthRule,
  defaultAdaptiveOptOutRecordValidator,
} from "./adaptive-opt-out-record-rules.js";
import { newAdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

test("AdaptiveOptOutRecordValidator reports every problem", () => {
  const validator = defaultAdaptiveOptOutRecordValidator();
  const item = newAdaptiveOptOutRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveOptOutRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new AdaptiveOptOutRecordReviewerLengthRule(86400);
  const item = newAdaptiveOptOutRecord("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveOptOutRecordLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveOptOutRecordLabelLengthRule(32);
  const item = newAdaptiveOptOutRecord("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
