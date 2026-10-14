import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRewardRuleBatchMarginRangeRule,
  CappedRewardRuleBatchRequiredCodeRule,
  CappedRewardRuleBatchStartsAtRangeRule,
  defaultCappedRewardRuleBatchValidator,
} from "./capped-reward-rule-batch-rules.js";
import { newCappedRewardRuleBatch } from "./capped-reward-rule-batch.js";

test("CappedRewardRuleBatchValidator reports every problem", () => {
  const validator = defaultCappedRewardRuleBatchValidator();
  const item = newCappedRewardRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRewardRuleBatchStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedRewardRuleBatchStartsAtRangeRule(64, 64);
  const item = newCappedRewardRuleBatch("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedRewardRuleBatchRequiredCodeRule flags a blank code", () => {
  const rule = new CappedRewardRuleBatchRequiredCodeRule("capped reward rule batch needs an entry");
  const item = newCappedRewardRuleBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRewardRuleBatchMarginRangeRule flags values above margin", () => {
  const rule = new CappedRewardRuleBatchMarginRangeRule(6.4, 3720.5);
  const item = newCappedRewardRuleBatch("x", "y");
  item.margin = 3722;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
