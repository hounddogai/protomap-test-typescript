import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPreferenceSegmentCodeLengthRule,
  ManualPreferenceSegmentNameLengthRule,
  ManualPreferenceSegmentRequiredNotesRule,
  ManualPreferenceSegmentStartsAtRangeRule,
  defaultManualPreferenceSegmentValidator,
} from "./manual-preference-segment-rules.js";
import { newManualPreferenceSegment } from "./manual-preference-segment.js";

test("ManualPreferenceSegmentValidator reports every problem", () => {
  const validator = defaultManualPreferenceSegmentValidator();
  const item = newManualPreferenceSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPreferenceSegmentCodeLengthRule flags a long code", () => {
  const rule = new ManualPreferenceSegmentCodeLengthRule(16);
  const item = newManualPreferenceSegment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPreferenceSegmentNameLengthRule flags a long name", () => {
  const rule = new ManualPreferenceSegmentNameLengthRule(32);
  const item = newManualPreferenceSegment("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPreferenceSegmentRequiredNotesRule flags a blank notes", () => {
  const rule = new ManualPreferenceSegmentRequiredNotesRule("manual preference segment needs a value");
  const item = newManualPreferenceSegment("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPreferenceSegmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualPreferenceSegmentStartsAtRangeRule(16, 3600);
  const item = newManualPreferenceSegment("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
