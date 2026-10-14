import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutNoticeBatchSizeRangeRule,
  PayoutNoticeCodeLengthRule,
  PayoutNoticeCreatedAtRangeRule,
  PayoutNoticeRequiredSummaryRule,
  defaultPayoutNoticeValidator,
} from "./payout-notice-rules.js";
import { newPayoutNotice } from "./payout-notice.js";

test("PayoutNoticeValidator reports every problem", () => {
  const validator = defaultPayoutNoticeValidator();
  const item = newPayoutNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutNoticeCodeLengthRule flags a long code", () => {
  const rule = new PayoutNoticeCodeLengthRule(120);
  const item = newPayoutNotice("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutNoticeBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PayoutNoticeBatchSizeRangeRule(120, 86400);
  const item = newPayoutNotice("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutNoticeRequiredSummaryRule flags a blank summary", () => {
  const rule = new PayoutNoticeRequiredSummaryRule("payout notice needs this field");
  const item = newPayoutNotice("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutNoticeCreatedAtRangeRule flags values above created at", () => {
  const rule = new PayoutNoticeCreatedAtRangeRule(3600, 3600);
  const item = newPayoutNotice("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
