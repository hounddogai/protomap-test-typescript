import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutSegmentCeilingRangeRule,
  OptOutSegmentCohortLengthRule,
  OptOutSegmentContactEmailLengthRule,
  OptOutSegmentRequiredContactEmailRule,
  OptOutSegmentRequiredTitleRule,
  defaultOptOutSegmentValidator,
} from "./opt-out-segment-rules.js";
import { newOptOutSegment } from "./opt-out-segment.js";

test("OptOutSegmentValidator reports every problem", () => {
  const validator = defaultOptOutSegmentValidator();
  const item = newOptOutSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutSegmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new OptOutSegmentContactEmailLengthRule(64);
  const item = newOptOutSegment("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new OptOutSegmentRequiredTitleRule("opt out segment needs an entry");
  const item = newOptOutSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutSegmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new OptOutSegmentCeilingRangeRule(6.4, 953.8);
  const item = newOptOutSegment("x", "y");
  item.ceiling = 955.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutSegmentCohortLengthRule flags a long cohort", () => {
  const rule = new OptOutSegmentCohortLengthRule(255);
  const item = newOptOutSegment("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutSegmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new OptOutSegmentRequiredContactEmailRule("opt out segment needs this field");
  const item = newOptOutSegment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
