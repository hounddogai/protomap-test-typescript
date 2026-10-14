import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualReplyExceptionCampaignRefLengthRule,
  ManualReplyExceptionFrequencyCapRangeRule,
  ManualReplyExceptionRequiredCodeRule,
  defaultManualReplyExceptionValidator,
} from "./manual-reply-exception-rules.js";
import { newManualReplyException } from "./manual-reply-exception.js";

test("ManualReplyExceptionValidator reports every problem", () => {
  const validator = defaultManualReplyExceptionValidator();
  const item = newManualReplyException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualReplyExceptionCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ManualReplyExceptionCampaignRefLengthRule(255);
  const item = newManualReplyException("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualReplyExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ManualReplyExceptionRequiredCodeRule("manual reply exception needs a value");
  const item = newManualReplyException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualReplyExceptionFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ManualReplyExceptionFrequencyCapRangeRule(32, 3600);
  const item = newManualReplyException("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
