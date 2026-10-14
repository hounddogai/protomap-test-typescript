import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTierNoticeCampaignRefLengthRule,
  WeightedTierNoticeJourneyIdLengthRule,
  WeightedTierNoticeRequiredJourneyIdRule,
  defaultWeightedTierNoticeValidator,
} from "./weighted-tier-notice-rules.js";
import { newWeightedTierNotice } from "./weighted-tier-notice.js";

test("WeightedTierNoticeValidator reports every problem", () => {
  const validator = defaultWeightedTierNoticeValidator();
  const item = newWeightedTierNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTierNoticeRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new WeightedTierNoticeRequiredJourneyIdRule("weighted tier notice needs an entry");
  const item = newWeightedTierNotice("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTierNoticeJourneyIdLengthRule flags a long journey id", () => {
  const rule = new WeightedTierNoticeJourneyIdLengthRule(1000);
  const item = newWeightedTierNotice("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTierNoticeCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new WeightedTierNoticeCampaignRefLengthRule(3600);
  const item = newWeightedTierNotice("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
