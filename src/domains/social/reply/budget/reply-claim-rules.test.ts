import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyClaimChannelLengthRule,
  ReplyClaimJourneyIdLengthRule,
  ReplyClaimRequiredChannelRule,
  ReplyClaimRequiredNameRule,
  ReplyClaimThresholdRangeRule,
  defaultReplyClaimValidator,
} from "./reply-claim-rules.js";
import { newReplyClaim } from "./reply-claim.js";

test("ReplyClaimValidator reports every problem", () => {
  const validator = defaultReplyClaimValidator();
  const item = newReplyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyClaimThresholdRangeRule flags values above threshold", () => {
  const rule = new ReplyClaimThresholdRangeRule(6.5, 4455.1);
  const item = newReplyClaim("x", "y");
  item.threshold = 4456.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyClaimJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ReplyClaimJourneyIdLengthRule(16);
  const item = newReplyClaim("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyClaimRequiredNameRule flags a blank name", () => {
  const rule = new ReplyClaimRequiredNameRule("reply claim needs this field");
  const item = newReplyClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyClaimChannelLengthRule flags a long channel", () => {
  const rule = new ReplyClaimChannelLengthRule(64);
  const item = newReplyClaim("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyClaimRequiredChannelRule flags a blank channel", () => {
  const rule = new ReplyClaimRequiredChannelRule("reply claim needs an entry");
  const item = newReplyClaim("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
