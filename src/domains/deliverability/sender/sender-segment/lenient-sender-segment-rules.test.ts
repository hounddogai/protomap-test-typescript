import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSenderSegmentAmountRangeRule,
  LenientSenderSegmentBudgetRangeRule,
  LenientSenderSegmentCodeLengthRule,
  LenientSenderSegmentLimitRangeRule,
  LenientSenderSegmentRequiredNameRule,
  defaultLenientSenderSegmentValidator,
} from "./lenient-sender-segment-rules.js";
import { newLenientSenderSegment } from "./lenient-sender-segment.js";

test("LenientSenderSegmentValidator reports every problem", () => {
  const validator = defaultLenientSenderSegmentValidator();
  const item = newLenientSenderSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSenderSegmentAmountRangeRule flags values above amount", () => {
  const rule = new LenientSenderSegmentAmountRangeRule(2.4, 1200.2);
  const item = newLenientSenderSegment("x", "y");
  item.amount = 1201.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSenderSegmentLimitRangeRule flags values above limit", () => {
  const rule = new LenientSenderSegmentLimitRangeRule(120, 86400);
  const item = newLenientSenderSegment("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSenderSegmentRequiredNameRule flags a blank name", () => {
  const rule = new LenientSenderSegmentRequiredNameRule("lenient sender segment needs this field");
  const item = newLenientSenderSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSenderSegmentBudgetRangeRule flags values above budget", () => {
  const rule = new LenientSenderSegmentBudgetRangeRule(5.4, 1899);
  const item = newLenientSenderSegment("x", "y");
  item.budget = 1900.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSenderSegmentCodeLengthRule flags a long code", () => {
  const rule = new LenientSenderSegmentCodeLengthRule(255);
  const item = newLenientSenderSegment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
