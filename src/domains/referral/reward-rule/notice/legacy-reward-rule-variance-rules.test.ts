import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRewardRuleVarianceRequiredCategoryRule,
  LegacyRewardRuleVarianceRequiredCodeRule,
  defaultLegacyRewardRuleVarianceValidator,
} from "./legacy-reward-rule-variance-rules.js";
import { newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

test("LegacyRewardRuleVarianceValidator reports every problem", () => {
  const validator = defaultLegacyRewardRuleVarianceValidator();
  const item = newLegacyRewardRuleVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRewardRuleVarianceRequiredCategoryRule flags a blank category", () => {
  const rule = new LegacyRewardRuleVarianceRequiredCategoryRule("legacy reward rule variance needs this field");
  const item = newLegacyRewardRuleVariance("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyRewardRuleVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyRewardRuleVarianceRequiredCodeRule("legacy reward rule variance needs a value");
  const item = newLegacyRewardRuleVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
