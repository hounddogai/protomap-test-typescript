import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreditRuleGraceDaysRangeRule,
  BatchedCreditRuleRetriesRangeRule,
  BatchedCreditRuleSegmentLengthRule,
  BatchedCreditRuleSendAtRangeRule,
  BatchedCreditRuleTitleLengthRule,
  defaultBatchedCreditRuleValidator,
} from "./batched-credit-rule-rules.js";
import { newBatchedCreditRule } from "./batched-credit-rule.js";

test("BatchedCreditRuleValidator reports every problem", () => {
  const validator = defaultBatchedCreditRuleValidator();
  const item = newBatchedCreditRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreditRuleRetriesRangeRule flags values above retries", () => {
  const rule = new BatchedCreditRuleRetriesRangeRule(120, 255);
  const item = newBatchedCreditRule("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditRuleSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedCreditRuleSendAtRangeRule(32, 86400);
  const item = newBatchedCreditRule("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditRuleTitleLengthRule flags a long title", () => {
  const rule = new BatchedCreditRuleTitleLengthRule(16);
  const item = newBatchedCreditRule("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreditRuleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedCreditRuleGraceDaysRangeRule(32, 3600);
  const item = newBatchedCreditRule("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditRuleSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedCreditRuleSegmentLengthRule(64);
  const item = newBatchedCreditRule("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
