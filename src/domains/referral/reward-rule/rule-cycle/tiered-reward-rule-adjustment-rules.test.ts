import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardRuleAdjustmentCodeLengthRule,
  TieredRewardRuleAdjustmentRequiredCodeRule,
  TieredRewardRuleAdjustmentRetriesRangeRule,
  TieredRewardRuleAdjustmentTitleLengthRule,
  defaultTieredRewardRuleAdjustmentValidator,
} from "./tiered-reward-rule-adjustment-rules.js";
import { newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("TieredRewardRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredRewardRuleAdjustmentValidator();
  const item = newTieredRewardRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardRuleAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRewardRuleAdjustmentRequiredCodeRule("tiered reward rule adjustment needs this field");
  const item = newTieredRewardRuleAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new TieredRewardRuleAdjustmentCodeLengthRule(32);
  const item = newTieredRewardRuleAdjustment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardRuleAdjustmentRetriesRangeRule flags values above retries", () => {
  const rule = new TieredRewardRuleAdjustmentRetriesRangeRule(64, 80);
  const item = newTieredRewardRuleAdjustment("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardRuleAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new TieredRewardRuleAdjustmentTitleLengthRule(32);
  const item = newTieredRewardRuleAdjustment("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
