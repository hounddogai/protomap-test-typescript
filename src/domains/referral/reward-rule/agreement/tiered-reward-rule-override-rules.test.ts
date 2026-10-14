import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardRuleOverrideMarginRangeRule,
  TieredRewardRuleOverrideRequiredCodeRule,
  TieredRewardRuleOverrideRequiredSourceRule,
  defaultTieredRewardRuleOverrideValidator,
} from "./tiered-reward-rule-override-rules.js";
import { newTieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

test("TieredRewardRuleOverrideValidator reports every problem", () => {
  const validator = defaultTieredRewardRuleOverrideValidator();
  const item = newTieredRewardRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardRuleOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRewardRuleOverrideRequiredCodeRule("tiered reward rule override needs an entry");
  const item = newTieredRewardRuleOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleOverrideRequiredSourceRule flags a blank source", () => {
  const rule = new TieredRewardRuleOverrideRequiredSourceRule("tiered reward rule override needs this field");
  const item = newTieredRewardRuleOverride("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleOverrideMarginRangeRule flags values above margin", () => {
  const rule = new TieredRewardRuleOverrideMarginRangeRule(0.7, 1902.7);
  const item = newTieredRewardRuleOverride("x", "y");
  item.margin = 1904.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
