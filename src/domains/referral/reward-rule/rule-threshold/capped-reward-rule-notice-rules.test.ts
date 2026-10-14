import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRewardRuleNoticeExpiresAtRangeRule,
  CappedRewardRuleNoticeNameLengthRule,
  CappedRewardRuleNoticeRequiredLabelRule,
  defaultCappedRewardRuleNoticeValidator,
} from "./capped-reward-rule-notice-rules.js";
import { newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

test("CappedRewardRuleNoticeValidator reports every problem", () => {
  const validator = defaultCappedRewardRuleNoticeValidator();
  const item = newCappedRewardRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRewardRuleNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new CappedRewardRuleNoticeRequiredLabelRule("capped reward rule notice needs this field");
  const item = newCappedRewardRuleNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRewardRuleNoticeNameLengthRule flags a long name", () => {
  const rule = new CappedRewardRuleNoticeNameLengthRule(3600);
  const item = newCappedRewardRuleNotice("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedRewardRuleNoticeExpiresAtRangeRule flags values above expires at", () => {
  const rule = new CappedRewardRuleNoticeExpiresAtRangeRule(1000, 86400);
  const item = newCappedRewardRuleNotice("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
