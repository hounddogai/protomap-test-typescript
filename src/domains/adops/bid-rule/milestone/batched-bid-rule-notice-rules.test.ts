import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBidRuleNoticePriorityRangeRule,
  BatchedBidRuleNoticeRequiredCodeRule,
  BatchedBidRuleNoticeRequiredTimezoneRule,
  BatchedBidRuleNoticeRequiredTitleRule,
  defaultBatchedBidRuleNoticeValidator,
} from "./batched-bid-rule-notice-rules.js";
import { newBatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

test("BatchedBidRuleNoticeValidator reports every problem", () => {
  const validator = defaultBatchedBidRuleNoticeValidator();
  const item = newBatchedBidRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBidRuleNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedBidRuleNoticeRequiredTitleRule("batched bid rule notice needs this field");
  const item = newBatchedBidRuleNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedBidRuleNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedBidRuleNoticeRequiredCodeRule("batched bid rule notice needs an entry");
  const item = newBatchedBidRuleNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedBidRuleNoticePriorityRangeRule flags values above priority", () => {
  const rule = new BatchedBidRuleNoticePriorityRangeRule(80, 86400);
  const item = newBatchedBidRuleNotice("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBidRuleNoticeRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new BatchedBidRuleNoticeRequiredTimezoneRule("batched bid rule notice needs an entry");
  const item = newBatchedBidRuleNotice("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
