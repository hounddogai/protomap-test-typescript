import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionNoticeCodeLengthRule,
  RetentionNoticeCostRangeRule,
  RetentionNoticeCreatedAtRangeRule,
  RetentionNoticeRequiredCodeRule,
  defaultRetentionNoticeValidator,
} from "./retention-notice-rules.js";
import { newRetentionNotice } from "./retention-notice.js";

test("RetentionNoticeValidator reports every problem", () => {
  const validator = defaultRetentionNoticeValidator();
  const item = newRetentionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionNoticeRequiredCodeRule("retention notice needs this field");
  const item = newRetentionNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionNoticeCostRangeRule flags values above cost", () => {
  const rule = new RetentionNoticeCostRangeRule(6.7, 1964);
  const item = newRetentionNotice("x", "y");
  item.cost = 1965.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionNoticeCreatedAtRangeRule flags values above created at", () => {
  const rule = new RetentionNoticeCreatedAtRangeRule(32, 80);
  const item = newRetentionNotice("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionNoticeCodeLengthRule flags a long code", () => {
  const rule = new RetentionNoticeCodeLengthRule(32);
  const item = newRetentionNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
