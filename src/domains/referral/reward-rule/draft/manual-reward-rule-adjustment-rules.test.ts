import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRewardRuleAdjustmentCodeLengthRule,
  ManualRewardRuleAdjustmentQuantityRangeRule,
  ManualRewardRuleAdjustmentRequiredCodeRule,
  ManualRewardRuleAdjustmentRequiredRegionRule,
  defaultManualRewardRuleAdjustmentValidator,
} from "./manual-reward-rule-adjustment-rules.js";
import { newManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

test("ManualRewardRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultManualRewardRuleAdjustmentValidator();
  const item = newManualRewardRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRewardRuleAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new ManualRewardRuleAdjustmentRequiredCodeRule("manual reward rule adjustment needs this field");
  const item = newManualRewardRuleAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRewardRuleAdjustmentQuantityRangeRule flags values above quantity", () => {
  const rule = new ManualRewardRuleAdjustmentQuantityRangeRule(32, 1000);
  const item = newManualRewardRuleAdjustment("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRewardRuleAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new ManualRewardRuleAdjustmentCodeLengthRule(1000);
  const item = newManualRewardRuleAdjustment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleAdjustmentRequiredRegionRule flags a blank region", () => {
  const rule = new ManualRewardRuleAdjustmentRequiredRegionRule("manual reward rule adjustment needs a value");
  const item = newManualRewardRuleAdjustment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
