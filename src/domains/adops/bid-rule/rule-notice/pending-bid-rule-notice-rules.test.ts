import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBidRuleNoticeLimitRangeRule,
  PendingBidRuleNoticeNameLengthRule,
  PendingBidRuleNoticeTitleLengthRule,
  defaultPendingBidRuleNoticeValidator,
} from "./pending-bid-rule-notice-rules.js";
import { newPendingBidRuleNotice } from "./pending-bid-rule-notice.js";

test("PendingBidRuleNoticeValidator reports every problem", () => {
  const validator = defaultPendingBidRuleNoticeValidator();
  const item = newPendingBidRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBidRuleNoticeTitleLengthRule flags a long title", () => {
  const rule = new PendingBidRuleNoticeTitleLengthRule(3600);
  const item = newPendingBidRuleNotice("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBidRuleNoticeLimitRangeRule flags values above limit", () => {
  const rule = new PendingBidRuleNoticeLimitRangeRule(16, 32);
  const item = newPendingBidRuleNotice("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRuleNoticeNameLengthRule flags a long name", () => {
  const rule = new PendingBidRuleNoticeNameLengthRule(64);
  const item = newPendingBidRuleNotice("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
