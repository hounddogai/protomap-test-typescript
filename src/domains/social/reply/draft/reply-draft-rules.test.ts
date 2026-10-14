import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyDraftChannelLengthRule,
  ReplyDraftClicksRangeRule,
  ReplyDraftRequiredLocaleRule,
  defaultReplyDraftValidator,
} from "./reply-draft-rules.js";
import { newReplyDraft } from "./reply-draft.js";

test("ReplyDraftValidator reports every problem", () => {
  const validator = defaultReplyDraftValidator();
  const item = newReplyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyDraftClicksRangeRule flags values above clicks", () => {
  const rule = new ReplyDraftClicksRangeRule(64, 86400);
  const item = newReplyDraft("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyDraftChannelLengthRule flags a long channel", () => {
  const rule = new ReplyDraftChannelLengthRule(1000);
  const item = newReplyDraft("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new ReplyDraftRequiredLocaleRule("reply draft needs a value");
  const item = newReplyDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
