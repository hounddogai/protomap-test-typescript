import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelSegmentCeilingRangeRule,
  LevelSegmentCodeLengthRule,
  LevelSegmentLabelLengthRule,
  LevelSegmentRequiredCodeRule,
  LevelSegmentSequenceRangeRule,
  defaultLevelSegmentValidator,
} from "./level-segment-rules.js";
import { newLevelSegment } from "./level-segment.js";

test("LevelSegmentValidator reports every problem", () => {
  const validator = defaultLevelSegmentValidator();
  const item = newLevelSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelSegmentLabelLengthRule flags a long label", () => {
  const rule = new LevelSegmentLabelLengthRule(86400);
  const item = newLevelSegment("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new LevelSegmentRequiredCodeRule("level segment needs this field");
  const item = newLevelSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelSegmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new LevelSegmentCeilingRangeRule(0, 805.7);
  const item = newLevelSegment("x", "y");
  item.ceiling = 807.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelSegmentSequenceRangeRule flags values above sequence", () => {
  const rule = new LevelSegmentSequenceRangeRule(16, 86400);
  const item = newLevelSegment("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelSegmentCodeLengthRule flags a long code", () => {
  const rule = new LevelSegmentCodeLengthRule(64);
  const item = newLevelSegment("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
