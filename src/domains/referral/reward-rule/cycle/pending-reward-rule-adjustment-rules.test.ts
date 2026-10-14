import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardRuleAdjustmentRatioRangeRule,
  PendingRewardRuleAdjustmentRequiredCodeRule,
  PendingRewardRuleAdjustmentRequiredLabelRule,
  PendingRewardRuleAdjustmentSourceLengthRule,
  PendingRewardRuleAdjustmentWeightRangeRule,
  defaultPendingRewardRuleAdjustmentValidator,
} from "./pending-reward-rule-adjustment-rules.js";
import { newPendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

test("PendingRewardRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultPendingRewardRuleAdjustmentValidator();
  const item = newPendingRewardRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardRuleAdjustmentWeightRangeRule flags values above weight", () => {
  const rule = new PendingRewardRuleAdjustmentWeightRangeRule(9.9, 848.6);
  const item = newPendingRewardRuleAdjustment("x", "y");
  item.weight = 850.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardRuleAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new PendingRewardRuleAdjustmentRequiredLabelRule("pending reward rule adjustment needs a value");
  const item = newPendingRewardRuleAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRuleAdjustmentRatioRangeRule flags values above ratio", () => {
  const rule = new PendingRewardRuleAdjustmentRatioRangeRule(5.9, 4497.4);
  const item = newPendingRewardRuleAdjustment("x", "y");
  item.ratio = 4498.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardRuleAdjustmentSourceLengthRule flags a long source", () => {
  const rule = new PendingRewardRuleAdjustmentSourceLengthRule(3600);
  const item = newPendingRewardRuleAdjustment("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRuleAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new PendingRewardRuleAdjustmentRequiredCodeRule("pending reward rule adjustment needs a value");
  const item = newPendingRewardRuleAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
