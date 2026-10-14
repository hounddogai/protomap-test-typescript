import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardRuleNoticeCodeLengthRule,
  PendingRewardRuleNoticeNameLengthRule,
  PendingRewardRuleNoticeRateRangeRule,
  PendingRewardRuleNoticeRequiredNameRule,
  PendingRewardRuleNoticeRequiredTitleRule,
  PendingRewardRuleNoticeTitleLengthRule,
  defaultPendingRewardRuleNoticeValidator,
} from "./pending-reward-rule-notice-rules.js";
import { newPendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

test("PendingRewardRuleNoticeValidator reports every problem", () => {
  const validator = defaultPendingRewardRuleNoticeValidator();
  const item = newPendingRewardRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardRuleNoticeCodeLengthRule flags a long code", () => {
  const rule = new PendingRewardRuleNoticeCodeLengthRule(80);
  const item = newPendingRewardRuleNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRuleNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new PendingRewardRuleNoticeRequiredTitleRule("pending reward rule notice needs this field");
  const item = newPendingRewardRuleNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRuleNoticeRequiredNameRule flags a blank name", () => {
  const rule = new PendingRewardRuleNoticeRequiredNameRule("pending reward rule notice needs an entry");
  const item = newPendingRewardRuleNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRuleNoticeRateRangeRule flags values above rate", () => {
  const rule = new PendingRewardRuleNoticeRateRangeRule(2.9, 398.3);
  const item = newPendingRewardRuleNotice("x", "y");
  item.rate = 399.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardRuleNoticeNameLengthRule flags a long name", () => {
  const rule = new PendingRewardRuleNoticeNameLengthRule(64);
  const item = newPendingRewardRuleNotice("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRuleNoticeTitleLengthRule flags a long title", () => {
  const rule = new PendingRewardRuleNoticeTitleLengthRule(255);
  const item = newPendingRewardRuleNotice("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
