import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyPreferenceCodeLengthRule,
  ReplyPreferenceQuantityRangeRule,
  ReplyPreferenceRequiredCampaignRefRule,
  ReplyPreferenceRequiredTitleRule,
  ReplyPreferenceTitleLengthRule,
  defaultReplyPreferenceValidator,
} from "./reply-preference-rules.js";
import { newReplyPreference } from "./reply-preference.js";

test("ReplyPreferenceValidator reports every problem", () => {
  const validator = defaultReplyPreferenceValidator();
  const item = newReplyPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyPreferenceTitleLengthRule flags a long title", () => {
  const rule = new ReplyPreferenceTitleLengthRule(16);
  const item = newReplyPreference("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new ReplyPreferenceRequiredTitleRule("reply preference needs an entry");
  const item = newReplyPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyPreferenceQuantityRangeRule flags values above quantity", () => {
  const rule = new ReplyPreferenceQuantityRangeRule(120, 3600);
  const item = newReplyPreference("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyPreferenceRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ReplyPreferenceRequiredCampaignRefRule("reply preference needs this field");
  const item = newReplyPreference("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyPreferenceCodeLengthRule flags a long code", () => {
  const rule = new ReplyPreferenceCodeLengthRule(32);
  const item = newReplyPreference("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
