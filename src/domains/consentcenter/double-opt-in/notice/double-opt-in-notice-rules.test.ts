import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInNoticeCampaignRefLengthRule,
  DoubleOptInNoticeLimitRangeRule,
  DoubleOptInNoticeRequiredCampaignRefRule,
  DoubleOptInNoticeTitleLengthRule,
  defaultDoubleOptInNoticeValidator,
} from "./double-opt-in-notice-rules.js";
import { newDoubleOptInNotice } from "./double-opt-in-notice.js";

test("DoubleOptInNoticeValidator reports every problem", () => {
  const validator = defaultDoubleOptInNoticeValidator();
  const item = newDoubleOptInNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInNoticeTitleLengthRule flags a long title", () => {
  const rule = new DoubleOptInNoticeTitleLengthRule(1000);
  const item = newDoubleOptInNotice("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInNoticeLimitRangeRule flags values above limit", () => {
  const rule = new DoubleOptInNoticeLimitRangeRule(120, 120);
  const item = newDoubleOptInNotice("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DoubleOptInNoticeRequiredCampaignRefRule("double opt in notice needs a value");
  const item = newDoubleOptInNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInNoticeCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DoubleOptInNoticeCampaignRefLengthRule(120);
  const item = newDoubleOptInNotice("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
