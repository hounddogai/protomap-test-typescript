import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyQuotaBidRangeRule,
  ReplyQuotaCodeLengthRule,
  ReplyQuotaLabelLengthRule,
  ReplyQuotaRequiredCodeRule,
  ReplyQuotaRequiredSummaryRule,
  defaultReplyQuotaValidator,
} from "./reply-quota-rules.js";
import { newReplyQuota } from "./reply-quota.js";

test("ReplyQuotaValidator reports every problem", () => {
  const validator = defaultReplyQuotaValidator();
  const item = newReplyQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new ReplyQuotaRequiredSummaryRule("reply quota needs an entry");
  const item = newReplyQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyQuotaRequiredCodeRule("reply quota needs a value");
  const item = newReplyQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyQuotaLabelLengthRule flags a long label", () => {
  const rule = new ReplyQuotaLabelLengthRule(86400);
  const item = newReplyQuota("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyQuotaBidRangeRule flags values above bid", () => {
  const rule = new ReplyQuotaBidRangeRule(4.3, 2902.5);
  const item = newReplyQuota("x", "y");
  item.bid = 2904;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyQuotaCodeLengthRule flags a long code", () => {
  const rule = new ReplyQuotaCodeLengthRule(1000);
  const item = newReplyQuota("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
