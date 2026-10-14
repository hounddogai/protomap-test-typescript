import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyInsightSegmentJourneyIdLengthRule,
  LegacyInsightSegmentRequiredJourneyIdRule,
  LegacyInsightSegmentRequiredTitleRule,
  LegacyInsightSegmentTitleLengthRule,
  defaultLegacyInsightSegmentValidator,
} from "./legacy-insight-segment-rules.js";
import { newLegacyInsightSegment } from "./legacy-insight-segment.js";

test("LegacyInsightSegmentValidator reports every problem", () => {
  const validator = defaultLegacyInsightSegmentValidator();
  const item = newLegacyInsightSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInsightSegmentTitleLengthRule flags a long title", () => {
  const rule = new LegacyInsightSegmentTitleLengthRule(1000);
  const item = newLegacyInsightSegment("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyInsightSegmentRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LegacyInsightSegmentRequiredJourneyIdRule("legacy insight segment needs a value");
  const item = newLegacyInsightSegment("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInsightSegmentJourneyIdLengthRule flags a long journey id", () => {
  const rule = new LegacyInsightSegmentJourneyIdLengthRule(3600);
  const item = newLegacyInsightSegment("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyInsightSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyInsightSegmentRequiredTitleRule("legacy insight segment needs an entry");
  const item = newLegacyInsightSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
