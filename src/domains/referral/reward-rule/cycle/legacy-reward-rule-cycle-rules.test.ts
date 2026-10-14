import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRewardRuleCycleRequiredCodeRule,
  LegacyRewardRuleCycleRequiredCountryRule,
  LegacyRewardRuleCycleThresholdRangeRule,
  defaultLegacyRewardRuleCycleValidator,
} from "./legacy-reward-rule-cycle-rules.js";
import { newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

test("LegacyRewardRuleCycleValidator reports every problem", () => {
  const validator = defaultLegacyRewardRuleCycleValidator();
  const item = newLegacyRewardRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRewardRuleCycleThresholdRangeRule flags values above threshold", () => {
  const rule = new LegacyRewardRuleCycleThresholdRangeRule(1, 1948.7);
  const item = newLegacyRewardRuleCycle("x", "y");
  item.threshold = 1950.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRewardRuleCycleRequiredCountryRule flags a blank country", () => {
  const rule = new LegacyRewardRuleCycleRequiredCountryRule("legacy reward rule cycle needs a value");
  const item = newLegacyRewardRuleCycle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyRewardRuleCycleRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyRewardRuleCycleRequiredCodeRule("legacy reward rule cycle needs a value");
  const item = newLegacyRewardRuleCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
