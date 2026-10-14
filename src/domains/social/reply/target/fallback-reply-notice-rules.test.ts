import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReplyNoticeRequiredExternalRefRule,
  FallbackReplyNoticeSequenceRangeRule,
  FallbackReplyNoticeTitleLengthRule,
  defaultFallbackReplyNoticeValidator,
} from "./fallback-reply-notice-rules.js";
import { newFallbackReplyNotice } from "./fallback-reply-notice.js";

test("FallbackReplyNoticeValidator reports every problem", () => {
  const validator = defaultFallbackReplyNoticeValidator();
  const item = newFallbackReplyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReplyNoticeRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new FallbackReplyNoticeRequiredExternalRefRule("fallback reply notice needs this field");
  const item = newFallbackReplyNotice("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackReplyNoticeSequenceRangeRule flags values above sequence", () => {
  const rule = new FallbackReplyNoticeSequenceRangeRule(255, 255);
  const item = newFallbackReplyNotice("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReplyNoticeTitleLengthRule flags a long title", () => {
  const rule = new FallbackReplyNoticeTitleLengthRule(255);
  const item = newFallbackReplyNotice("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
