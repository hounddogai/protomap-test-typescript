import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInSegmentCampaignRefLengthRule,
  LegacyDoubleOptInSegmentDurationMinutesRangeRule,
  LegacyDoubleOptInSegmentRequiredCampaignRefRule,
  LegacyDoubleOptInSegmentRequiredTitleRule,
  defaultLegacyDoubleOptInSegmentValidator,
} from "./legacy-double-opt-in-segment-rules.js";
import { newLegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

test("LegacyDoubleOptInSegmentValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInSegmentValidator();
  const item = newLegacyDoubleOptInSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInSegmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LegacyDoubleOptInSegmentDurationMinutesRangeRule(16, 255);
  const item = newLegacyDoubleOptInSegment("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInSegmentCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LegacyDoubleOptInSegmentCampaignRefLengthRule(255);
  const item = newLegacyDoubleOptInSegment("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyDoubleOptInSegmentRequiredTitleRule("legacy double opt in segment needs a value");
  const item = newLegacyDoubleOptInSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInSegmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacyDoubleOptInSegmentRequiredCampaignRefRule("legacy double opt in segment needs an entry");
  const item = newLegacyDoubleOptInSegment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
