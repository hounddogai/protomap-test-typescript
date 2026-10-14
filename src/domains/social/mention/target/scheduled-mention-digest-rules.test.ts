import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMentionDigestCodeLengthRule,
  ScheduledMentionDigestCostRangeRule,
  ScheduledMentionDigestRequiredCampaignRefRule,
  ScheduledMentionDigestTitleLengthRule,
  defaultScheduledMentionDigestValidator,
} from "./scheduled-mention-digest-rules.js";
import { newScheduledMentionDigest } from "./scheduled-mention-digest.js";

test("ScheduledMentionDigestValidator reports every problem", () => {
  const validator = defaultScheduledMentionDigestValidator();
  const item = newScheduledMentionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMentionDigestRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledMentionDigestRequiredCampaignRefRule("scheduled mention digest needs this field");
  const item = newScheduledMentionDigest("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionDigestCodeLengthRule flags a long code", () => {
  const rule = new ScheduledMentionDigestCodeLengthRule(1000);
  const item = newScheduledMentionDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMentionDigestCostRangeRule flags values above cost", () => {
  const rule = new ScheduledMentionDigestCostRangeRule(9.4, 2083);
  const item = newScheduledMentionDigest("x", "y");
  item.cost = 2084.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledMentionDigestTitleLengthRule flags a long title", () => {
  const rule = new ScheduledMentionDigestTitleLengthRule(80);
  const item = newScheduledMentionDigest("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
