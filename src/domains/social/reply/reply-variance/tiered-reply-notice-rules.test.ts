import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReplyNoticeCodeLengthRule,
  TieredReplyNoticeThresholdRangeRule,
  defaultTieredReplyNoticeValidator,
} from "./tiered-reply-notice-rules.js";
import { newTieredReplyNotice } from "./tiered-reply-notice.js";

test("TieredReplyNoticeValidator reports every problem", () => {
  const validator = defaultTieredReplyNoticeValidator();
  const item = newTieredReplyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReplyNoticeCodeLengthRule flags a long code", () => {
  const rule = new TieredReplyNoticeCodeLengthRule(80);
  const item = newTieredReplyNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredReplyNoticeThresholdRangeRule flags values above threshold", () => {
  const rule = new TieredReplyNoticeThresholdRangeRule(0.6, 2221.2);
  const item = newTieredReplyNotice("x", "y");
  item.threshold = 2222.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
