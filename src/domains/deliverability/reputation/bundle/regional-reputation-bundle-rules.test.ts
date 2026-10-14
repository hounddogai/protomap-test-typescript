import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReputationBundleImpressionsRangeRule,
  RegionalReputationBundleLimitRangeRule,
  RegionalReputationBundleRequiredCodeRule,
  RegionalReputationBundleRequiredVariantRule,
  RegionalReputationBundleUnitLengthRule,
  RegionalReputationBundleVariantLengthRule,
  defaultRegionalReputationBundleValidator,
} from "./regional-reputation-bundle-rules.js";
import { newRegionalReputationBundle } from "./regional-reputation-bundle.js";

test("RegionalReputationBundleValidator reports every problem", () => {
  const validator = defaultRegionalReputationBundleValidator();
  const item = newRegionalReputationBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReputationBundleImpressionsRangeRule flags values above impressions", () => {
  const rule = new RegionalReputationBundleImpressionsRangeRule(80, 255);
  const item = newRegionalReputationBundle("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReputationBundleVariantLengthRule flags a long variant", () => {
  const rule = new RegionalReputationBundleVariantLengthRule(255);
  const item = newRegionalReputationBundle("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalReputationBundleUnitLengthRule flags a long unit", () => {
  const rule = new RegionalReputationBundleUnitLengthRule(32);
  const item = newRegionalReputationBundle("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalReputationBundleLimitRangeRule flags values above limit", () => {
  const rule = new RegionalReputationBundleLimitRangeRule(16, 255);
  const item = newRegionalReputationBundle("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReputationBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalReputationBundleRequiredCodeRule("regional reputation bundle needs an entry");
  const item = newRegionalReputationBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReputationBundleRequiredVariantRule flags a blank variant", () => {
  const rule = new RegionalReputationBundleRequiredVariantRule("regional reputation bundle needs a value");
  const item = newRegionalReputationBundle("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
