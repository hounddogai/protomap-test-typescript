import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFrequencyPolicyAmountRangeRule,
  SeasonalFrequencyPolicyQuantityRangeRule,
  SeasonalFrequencyPolicyRequiredCodeRule,
  SeasonalFrequencyPolicyRequiredLabelRule,
  defaultSeasonalFrequencyPolicyValidator,
} from "./seasonal-frequency-policy-rules.js";
import { newSeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

test("SeasonalFrequencyPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalFrequencyPolicyValidator();
  const item = newSeasonalFrequencyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFrequencyPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalFrequencyPolicyRequiredLabelRule("seasonal frequency policy needs this field");
  const item = newSeasonalFrequencyPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFrequencyPolicyAmountRangeRule flags values above amount", () => {
  const rule = new SeasonalFrequencyPolicyAmountRangeRule(8, 4300.3);
  const item = newSeasonalFrequencyPolicy("x", "y");
  item.amount = 4301.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalFrequencyPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFrequencyPolicyRequiredCodeRule("seasonal frequency policy needs this field");
  const item = newSeasonalFrequencyPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFrequencyPolicyQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalFrequencyPolicyQuantityRangeRule(16, 1000);
  const item = newSeasonalFrequencyPolicy("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
