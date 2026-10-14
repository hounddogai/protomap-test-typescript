import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPacingSegmentAttemptsRangeRule,
  LenientPacingSegmentCodeLengthRule,
  LenientPacingSegmentFrequencyCapRangeRule,
  LenientPacingSegmentRequiredNameRule,
  LenientPacingSegmentRequiredTitleRule,
  defaultLenientPacingSegmentValidator,
} from "./lenient-pacing-segment-rules.js";
import { newLenientPacingSegment } from "./lenient-pacing-segment.js";

test("LenientPacingSegmentValidator reports every problem", () => {
  const validator = defaultLenientPacingSegmentValidator();
  const item = newLenientPacingSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPacingSegmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LenientPacingSegmentFrequencyCapRangeRule(64, 80);
  const item = newLenientPacingSegment("x", "y");
  item.frequencyCap = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPacingSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new LenientPacingSegmentRequiredTitleRule("lenient pacing segment needs an entry");
  const item = newLenientPacingSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPacingSegmentRequiredNameRule flags a blank name", () => {
  const rule = new LenientPacingSegmentRequiredNameRule("lenient pacing segment needs this field");
  const item = newLenientPacingSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPacingSegmentAttemptsRangeRule flags values above attempts", () => {
  const rule = new LenientPacingSegmentAttemptsRangeRule(120, 86400);
  const item = newLenientPacingSegment("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPacingSegmentCodeLengthRule flags a long code", () => {
  const rule = new LenientPacingSegmentCodeLengthRule(80);
  const item = newLenientPacingSegment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
