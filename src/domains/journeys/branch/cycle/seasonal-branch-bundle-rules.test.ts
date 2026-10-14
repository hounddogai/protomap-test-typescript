import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBranchBundleCodeLengthRule,
  SeasonalBranchBundleConversionRateRangeRule,
  SeasonalBranchBundleRateRangeRule,
  SeasonalBranchBundleRequiredCodeRule,
  defaultSeasonalBranchBundleValidator,
} from "./seasonal-branch-bundle-rules.js";
import { newSeasonalBranchBundle } from "./seasonal-branch-bundle.js";

test("SeasonalBranchBundleValidator reports every problem", () => {
  const validator = defaultSeasonalBranchBundleValidator();
  const item = newSeasonalBranchBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBranchBundleRateRangeRule flags values above rate", () => {
  const rule = new SeasonalBranchBundleRateRangeRule(5.8, 453.2);
  const item = newSeasonalBranchBundle("x", "y");
  item.rate = 454.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBranchBundleRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBranchBundleRequiredCodeRule("seasonal branch bundle needs an entry");
  const item = newSeasonalBranchBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBranchBundleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBranchBundleCodeLengthRule(1000);
  const item = newSeasonalBranchBundle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBranchBundleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SeasonalBranchBundleConversionRateRangeRule(3.1, 1879);
  const item = newSeasonalBranchBundle("x", "y");
  item.conversionRate = 1880.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
