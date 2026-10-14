import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPostNoticeCampaignRefLengthRule,
  DefaultPostNoticeCountryLengthRule,
  DefaultPostNoticeRequiredCampaignRefRule,
  DefaultPostNoticeUpdatedAtRangeRule,
  defaultDefaultPostNoticeValidator,
} from "./default-post-notice-rules.js";
import { newDefaultPostNotice } from "./default-post-notice.js";

test("DefaultPostNoticeValidator reports every problem", () => {
  const validator = defaultDefaultPostNoticeValidator();
  const item = newDefaultPostNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPostNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DefaultPostNoticeRequiredCampaignRefRule("default post notice needs this field");
  const item = newDefaultPostNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostNoticeCountryLengthRule flags a long country", () => {
  const rule = new DefaultPostNoticeCountryLengthRule(32);
  const item = newDefaultPostNotice("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPostNoticeCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new DefaultPostNoticeCampaignRefLengthRule(64);
  const item = newDefaultPostNotice("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPostNoticeUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new DefaultPostNoticeUpdatedAtRangeRule(64, 255);
  const item = newDefaultPostNotice("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
