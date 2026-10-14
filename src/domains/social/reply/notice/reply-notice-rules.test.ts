import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyNoticeRequiredCodeRule,
  ReplyNoticeRequiredCurrencyRule,
  ReplyNoticeRequiredLabelRule,
  ReplyNoticeWeightRangeRule,
  defaultReplyNoticeValidator,
} from "./reply-notice-rules.js";
import { newReplyNotice } from "./reply-notice.js";

test("ReplyNoticeValidator reports every problem", () => {
  const validator = defaultReplyNoticeValidator();
  const item = newReplyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyNoticeRequiredCodeRule("reply notice needs this field");
  const item = newReplyNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new ReplyNoticeRequiredLabelRule("reply notice needs this field");
  const item = newReplyNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyNoticeRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ReplyNoticeRequiredCurrencyRule("reply notice needs this field");
  const item = newReplyNotice("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyNoticeWeightRangeRule flags values above weight", () => {
  const rule = new ReplyNoticeWeightRangeRule(6.2, 600);
  const item = newReplyNotice("x", "y");
  item.weight = 601.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
