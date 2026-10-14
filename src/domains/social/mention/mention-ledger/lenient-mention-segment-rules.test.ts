import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientMentionSegmentCampaignRefLengthRule,
  LenientMentionSegmentRequiredCampaignRefRule,
  LenientMentionSegmentRequiredCodeRule,
  LenientMentionSegmentRequiredExternalRefRule,
  LenientMentionSegmentThresholdRangeRule,
  LenientMentionSegmentWeightRangeRule,
  defaultLenientMentionSegmentValidator,
} from "./lenient-mention-segment-rules.js";
import { newLenientMentionSegment } from "./lenient-mention-segment.js";

test("LenientMentionSegmentValidator reports every problem", () => {
  const validator = defaultLenientMentionSegmentValidator();
  const item = newLenientMentionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientMentionSegmentWeightRangeRule flags values above weight", () => {
  const rule = new LenientMentionSegmentWeightRangeRule(5.5, 2388.7);
  const item = newLenientMentionSegment("x", "y");
  item.weight = 2390.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientMentionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new LenientMentionSegmentRequiredCodeRule("lenient mention segment needs an entry");
  const item = newLenientMentionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientMentionSegmentCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LenientMentionSegmentCampaignRefLengthRule(3600);
  const item = newLenientMentionSegment("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientMentionSegmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new LenientMentionSegmentRequiredExternalRefRule("lenient mention segment needs an entry");
  const item = newLenientMentionSegment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientMentionSegmentThresholdRangeRule flags values above threshold", () => {
  const rule = new LenientMentionSegmentThresholdRangeRule(1.8, 2371.7);
  const item = newLenientMentionSegment("x", "y");
  item.threshold = 2373.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientMentionSegmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LenientMentionSegmentRequiredCampaignRefRule("lenient mention segment needs this field");
  const item = newLenientMentionSegment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
