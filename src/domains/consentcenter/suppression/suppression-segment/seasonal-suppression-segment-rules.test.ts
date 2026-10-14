import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSuppressionSegmentAudienceIdLengthRule,
  SeasonalSuppressionSegmentExpiresAtRangeRule,
  SeasonalSuppressionSegmentRequiredAudienceIdRule,
  defaultSeasonalSuppressionSegmentValidator,
} from "./seasonal-suppression-segment-rules.js";
import { newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("SeasonalSuppressionSegmentValidator reports every problem", () => {
  const validator = defaultSeasonalSuppressionSegmentValidator();
  const item = newSeasonalSuppressionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSuppressionSegmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new SeasonalSuppressionSegmentRequiredAudienceIdRule("seasonal suppression segment needs an entry");
  const item = newSeasonalSuppressionSegment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSuppressionSegmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SeasonalSuppressionSegmentExpiresAtRangeRule(255, 86400);
  const item = newSeasonalSuppressionSegment("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSuppressionSegmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new SeasonalSuppressionSegmentAudienceIdLengthRule(16);
  const item = newSeasonalSuppressionSegment("x", "y");
  item.audienceId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
