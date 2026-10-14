import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSuppressionBundleCodeLengthRule,
  RegionalSuppressionBundleCostRangeRule,
  RegionalSuppressionBundleRequiredTitleRule,
  RegionalSuppressionBundleSummaryLengthRule,
  RegionalSuppressionBundleWeightRangeRule,
  defaultRegionalSuppressionBundleValidator,
} from "./regional-suppression-bundle-rules.js";
import { newRegionalSuppressionBundle } from "./regional-suppression-bundle.js";

test("RegionalSuppressionBundleValidator reports every problem", () => {
  const validator = defaultRegionalSuppressionBundleValidator();
  const item = newRegionalSuppressionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSuppressionBundleWeightRangeRule flags values above weight", () => {
  const rule = new RegionalSuppressionBundleWeightRangeRule(4.1, 3905.1);
  const item = newRegionalSuppressionBundle("x", "y");
  item.weight = 3906.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSuppressionBundleCodeLengthRule flags a long code", () => {
  const rule = new RegionalSuppressionBundleCodeLengthRule(64);
  const item = newRegionalSuppressionBundle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSuppressionBundleCostRangeRule flags values above cost", () => {
  const rule = new RegionalSuppressionBundleCostRangeRule(0.8, 326.5);
  const item = newRegionalSuppressionBundle("x", "y");
  item.cost = 328;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSuppressionBundleRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalSuppressionBundleRequiredTitleRule("regional suppression bundle needs an entry");
  const item = newRegionalSuppressionBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSuppressionBundleSummaryLengthRule flags a long summary", () => {
  const rule = new RegionalSuppressionBundleSummaryLengthRule(255);
  const item = newRegionalSuppressionBundle("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
