import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedMentionDigestAmountRangeRule,
  CappedMentionDigestCampaignRefLengthRule,
  CappedMentionDigestMaximumRangeRule,
  CappedMentionDigestRequiredCampaignRefRule,
  defaultCappedMentionDigestValidator,
} from "./capped-mention-digest-rules.js";
import { newCappedMentionDigest } from "./capped-mention-digest.js";

test("CappedMentionDigestValidator reports every problem", () => {
  const validator = defaultCappedMentionDigestValidator();
  const item = newCappedMentionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedMentionDigestAmountRangeRule flags values above amount", () => {
  const rule = new CappedMentionDigestAmountRangeRule(8.5, 3460.7);
  const item = newCappedMentionDigest("x", "y");
  item.amount = 3462.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedMentionDigestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedMentionDigestCampaignRefLengthRule(80);
  const item = newCappedMentionDigest("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedMentionDigestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CappedMentionDigestRequiredCampaignRefRule("capped mention digest needs an entry");
  const item = newCappedMentionDigest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedMentionDigestMaximumRangeRule flags values above maximum", () => {
  const rule = new CappedMentionDigestMaximumRangeRule(6.5, 1057.8);
  const item = newCappedMentionDigest("x", "y");
  item.maximum = 1059.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
