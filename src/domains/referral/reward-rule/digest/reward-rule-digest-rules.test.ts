import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleDigestCodeLengthRule,
  RewardRuleDigestExpiresAtRangeRule,
  RewardRuleDigestRequiredTitleRule,
  defaultRewardRuleDigestValidator,
} from "./reward-rule-digest-rules.js";
import { newRewardRuleDigest } from "./reward-rule-digest.js";

test("RewardRuleDigestValidator reports every problem", () => {
  const validator = defaultRewardRuleDigestValidator();
  const item = newRewardRuleDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleDigestRequiredTitleRule flags a blank title", () => {
  const rule = new RewardRuleDigestRequiredTitleRule("reward rule digest needs a value");
  const item = newRewardRuleDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleDigestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RewardRuleDigestExpiresAtRangeRule(3600, 86400);
  const item = newRewardRuleDigest("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleDigestCodeLengthRule flags a long code", () => {
  const rule = new RewardRuleDigestCodeLengthRule(1000);
  const item = newRewardRuleDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
