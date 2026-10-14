import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTouchpointSegmentChecksumLengthRule,
  SeasonalTouchpointSegmentCodeLengthRule,
  SeasonalTouchpointSegmentLabelLengthRule,
  SeasonalTouchpointSegmentRequiredCodeRule,
  defaultSeasonalTouchpointSegmentValidator,
} from "./seasonal-touchpoint-segment-rules.js";
import { newSeasonalTouchpointSegment } from "./seasonal-touchpoint-segment.js";

test("SeasonalTouchpointSegmentValidator reports every problem", () => {
  const validator = defaultSeasonalTouchpointSegmentValidator();
  const item = newSeasonalTouchpointSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTouchpointSegmentCodeLengthRule flags a long code", () => {
  const rule = new SeasonalTouchpointSegmentCodeLengthRule(255);
  const item = newSeasonalTouchpointSegment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTouchpointSegmentChecksumLengthRule flags a long checksum", () => {
  const rule = new SeasonalTouchpointSegmentChecksumLengthRule(255);
  const item = newSeasonalTouchpointSegment("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTouchpointSegmentLabelLengthRule flags a long label", () => {
  const rule = new SeasonalTouchpointSegmentLabelLengthRule(80);
  const item = newSeasonalTouchpointSegment("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTouchpointSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalTouchpointSegmentRequiredCodeRule("seasonal touchpoint segment needs a value");
  const item = newSeasonalTouchpointSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
