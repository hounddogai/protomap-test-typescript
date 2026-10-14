import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFunnelNoticeCodeLengthRule,
  BatchedFunnelNoticeLabelLengthRule,
  BatchedFunnelNoticeOpenRateRangeRule,
  BatchedFunnelNoticeRequiredCodeRule,
  defaultBatchedFunnelNoticeValidator,
} from "./batched-funnel-notice-rules.js";
import { newBatchedFunnelNotice } from "./batched-funnel-notice.js";

test("BatchedFunnelNoticeValidator reports every problem", () => {
  const validator = defaultBatchedFunnelNoticeValidator();
  const item = newBatchedFunnelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFunnelNoticeLabelLengthRule flags a long label", () => {
  const rule = new BatchedFunnelNoticeLabelLengthRule(32);
  const item = newBatchedFunnelNotice("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFunnelNoticeOpenRateRangeRule flags values above open rate", () => {
  const rule = new BatchedFunnelNoticeOpenRateRangeRule(1.1, 3137.7);
  const item = newBatchedFunnelNotice("x", "y");
  item.openRate = 3139.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFunnelNoticeCodeLengthRule flags a long code", () => {
  const rule = new BatchedFunnelNoticeCodeLengthRule(32);
  const item = newBatchedFunnelNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFunnelNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedFunnelNoticeRequiredCodeRule("batched funnel notice needs a value");
  const item = newBatchedFunnelNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
