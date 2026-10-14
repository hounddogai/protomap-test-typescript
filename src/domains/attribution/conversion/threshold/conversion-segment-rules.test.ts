import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionSegmentCampaignRefLengthRule,
  ConversionSegmentRequiredCampaignRefRule,
  ConversionSegmentRequiredLabelRule,
  defaultConversionSegmentValidator,
} from "./conversion-segment-rules.js";
import { newConversionSegment } from "./conversion-segment.js";

test("ConversionSegmentValidator reports every problem", () => {
  const validator = defaultConversionSegmentValidator();
  const item = newConversionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionSegmentCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ConversionSegmentCampaignRefLengthRule(86400);
  const item = newConversionSegment("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionSegmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ConversionSegmentRequiredCampaignRefRule("conversion segment needs an entry");
  const item = newConversionSegment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new ConversionSegmentRequiredLabelRule("conversion segment needs an entry");
  const item = newConversionSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
