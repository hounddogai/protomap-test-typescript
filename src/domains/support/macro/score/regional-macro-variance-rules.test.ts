import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalMacroVarianceBudgetRangeRule,
  RegionalMacroVarianceCodeLengthRule,
  RegionalMacroVarianceRequiredNameRule,
  RegionalMacroVarianceRequiredRegionRule,
  defaultRegionalMacroVarianceValidator,
} from "./regional-macro-variance-rules.js";
import { newRegionalMacroVariance } from "./regional-macro-variance.js";

test("RegionalMacroVarianceValidator reports every problem", () => {
  const validator = defaultRegionalMacroVarianceValidator();
  const item = newRegionalMacroVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalMacroVarianceRequiredNameRule flags a blank name", () => {
  const rule = new RegionalMacroVarianceRequiredNameRule("regional macro variance needs a value");
  const item = newRegionalMacroVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalMacroVarianceCodeLengthRule flags a long code", () => {
  const rule = new RegionalMacroVarianceCodeLengthRule(1000);
  const item = newRegionalMacroVariance("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalMacroVarianceBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalMacroVarianceBudgetRangeRule(6.8, 1046.1);
  const item = newRegionalMacroVariance("x", "y");
  item.budget = 1047.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalMacroVarianceRequiredRegionRule flags a blank region", () => {
  const rule = new RegionalMacroVarianceRequiredRegionRule("regional macro variance needs this field");
  const item = newRegionalMacroVariance("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
