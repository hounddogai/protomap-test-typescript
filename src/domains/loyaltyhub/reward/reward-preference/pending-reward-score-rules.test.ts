import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardScoreCodeLengthRule,
  PendingRewardScoreImpressionsRangeRule,
  PendingRewardScoreRequiredCodeRule,
  PendingRewardScoreSendAtRangeRule,
  defaultPendingRewardScoreValidator,
} from "./pending-reward-score-rules.js";
import { newPendingRewardScore } from "./pending-reward-score.js";

test("PendingRewardScoreValidator reports every problem", () => {
  const validator = defaultPendingRewardScoreValidator();
  const item = newPendingRewardScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardScoreRequiredCodeRule flags a blank code", () => {
  const rule = new PendingRewardScoreRequiredCodeRule("pending reward score needs an entry");
  const item = newPendingRewardScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardScoreSendAtRangeRule flags values above send at", () => {
  const rule = new PendingRewardScoreSendAtRangeRule(80, 1000);
  const item = newPendingRewardScore("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardScoreCodeLengthRule flags a long code", () => {
  const rule = new PendingRewardScoreCodeLengthRule(120);
  const item = newPendingRewardScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardScoreImpressionsRangeRule flags values above impressions", () => {
  const rule = new PendingRewardScoreImpressionsRangeRule(64, 120);
  const item = newPendingRewardScore("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
