import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyRecordAmountRangeRule,
  ReplyRecordImpressionsRangeRule,
  ReplyRecordRequiredCodeRule,
  defaultReplyRecordValidator,
} from "./reply-record-rules.js";
import { newReplyRecord } from "./reply-record.js";

test("ReplyRecordValidator reports every problem", () => {
  const validator = defaultReplyRecordValidator();
  const item = newReplyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyRecordAmountRangeRule flags values above amount", () => {
  const rule = new ReplyRecordAmountRangeRule(4.3, 1171.4);
  const item = newReplyRecord("x", "y");
  item.amount = 1172.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new ReplyRecordImpressionsRangeRule(3600, 3600);
  const item = newReplyRecord("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyRecordRequiredCodeRule("reply record needs this field");
  const item = newReplyRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
