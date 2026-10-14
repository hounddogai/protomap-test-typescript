import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPayoutNoticeCampaignRefLengthRule,
  ScheduledPayoutNoticeLimitRangeRule,
  ScheduledPayoutNoticeRequiredCampaignRefRule,
  ScheduledPayoutNoticeRequiredLocaleRule,
  defaultScheduledPayoutNoticeValidator,
} from "./scheduled-payout-notice-rules.js";
import { newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

test("ScheduledPayoutNoticeValidator reports every problem", () => {
  const validator = defaultScheduledPayoutNoticeValidator();
  const item = newScheduledPayoutNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPayoutNoticeRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledPayoutNoticeRequiredLocaleRule("scheduled payout notice needs an entry");
  const item = newScheduledPayoutNotice("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPayoutNoticeLimitRangeRule flags values above limit", () => {
  const rule = new ScheduledPayoutNoticeLimitRangeRule(80, 120);
  const item = newScheduledPayoutNotice("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPayoutNoticeCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledPayoutNoticeCampaignRefLengthRule(255);
  const item = newScheduledPayoutNotice("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPayoutNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ScheduledPayoutNoticeRequiredCampaignRefRule("scheduled payout notice needs this field");
  const item = newScheduledPayoutNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
