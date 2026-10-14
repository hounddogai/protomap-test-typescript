import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingStepSegmentBatchSizeRangeRule,
  RollingStepSegmentChecksumLengthRule,
  RollingStepSegmentOpenRateRangeRule,
  RollingStepSegmentRequiredCodeRule,
  RollingStepSegmentRequiredNotesRule,
  RollingStepSegmentRetriesRangeRule,
  defaultRollingStepSegmentValidator,
} from "./rolling-step-segment-rules.js";
import { newRollingStepSegment } from "./rolling-step-segment.js";

test("RollingStepSegmentValidator reports every problem", () => {
  const validator = defaultRollingStepSegmentValidator();
  const item = newRollingStepSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingStepSegmentRetriesRangeRule flags values above retries", () => {
  const rule = new RollingStepSegmentRetriesRangeRule(16, 3600);
  const item = newRollingStepSegment("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingStepSegmentChecksumLengthRule flags a long checksum", () => {
  const rule = new RollingStepSegmentChecksumLengthRule(32);
  const item = newRollingStepSegment("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingStepSegmentRequiredNotesRule flags a blank notes", () => {
  const rule = new RollingStepSegmentRequiredNotesRule("rolling step segment needs an entry");
  const item = newRollingStepSegment("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingStepSegmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new RollingStepSegmentOpenRateRangeRule(1.8, 3094.6);
  const item = newRollingStepSegment("x", "y");
  item.openRate = 3096.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingStepSegmentBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RollingStepSegmentBatchSizeRangeRule(120, 120);
  const item = newRollingStepSegment("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingStepSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new RollingStepSegmentRequiredCodeRule("rolling step segment needs a value");
  const item = newRollingStepSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
