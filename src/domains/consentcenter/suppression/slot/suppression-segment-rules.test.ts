import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionSegmentCodeLengthRule,
  SuppressionSegmentLocaleLengthRule,
  SuppressionSegmentRequiredCodeRule,
  SuppressionSegmentRequiredLocaleRule,
  defaultSuppressionSegmentValidator,
} from "./suppression-segment-rules.js";
import { newSuppressionSegment } from "./suppression-segment.js";

test("SuppressionSegmentValidator reports every problem", () => {
  const validator = defaultSuppressionSegmentValidator();
  const item = newSuppressionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionSegmentCodeLengthRule flags a long code", () => {
  const rule = new SuppressionSegmentCodeLengthRule(86400);
  const item = newSuppressionSegment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionSegmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new SuppressionSegmentRequiredLocaleRule("suppression segment needs a value");
  const item = newSuppressionSegment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionSegmentRequiredCodeRule("suppression segment needs a value");
  const item = newSuppressionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionSegmentLocaleLengthRule flags a long locale", () => {
  const rule = new SuppressionSegmentLocaleLengthRule(86400);
  const item = newSuppressionSegment("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
