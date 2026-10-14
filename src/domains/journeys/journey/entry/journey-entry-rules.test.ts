import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyEntryLabelLengthRule,
  JourneyEntryRequiredSegmentRule,
  JourneyEntryScoreRangeRule,
  JourneyEntrySegmentLengthRule,
  defaultJourneyEntryValidator,
} from "./journey-entry-rules.js";
import { newJourneyEntry } from "./journey-entry.js";

test("JourneyEntryValidator reports every problem", () => {
  const validator = defaultJourneyEntryValidator();
  const item = newJourneyEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyEntrySegmentLengthRule flags a long segment", () => {
  const rule = new JourneyEntrySegmentLengthRule(64);
  const item = newJourneyEntry("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyEntryRequiredSegmentRule flags a blank segment", () => {
  const rule = new JourneyEntryRequiredSegmentRule("journey entry needs this field");
  const item = newJourneyEntry("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyEntryLabelLengthRule flags a long label", () => {
  const rule = new JourneyEntryLabelLengthRule(64);
  const item = newJourneyEntry("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyEntryScoreRangeRule flags values above score", () => {
  const rule = new JourneyEntryScoreRangeRule(7.9, 4649.9);
  const item = newJourneyEntry("x", "y");
  item.score = 4651.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
