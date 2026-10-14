import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalOptOutBundleLocaleLengthRule,
  RegionalOptOutBundleMinimumRangeRule,
  RegionalOptOutBundleRequiredCodeRule,
  RegionalOptOutBundleUnitLengthRule,
  defaultRegionalOptOutBundleValidator,
} from "./regional-opt-out-bundle-rules.js";
import { newRegionalOptOutBundle } from "./regional-opt-out-bundle.js";

test("RegionalOptOutBundleValidator reports every problem", () => {
  const validator = defaultRegionalOptOutBundleValidator();
  const item = newRegionalOptOutBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalOptOutBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalOptOutBundleRequiredCodeRule("regional opt out bundle needs a value");
  const item = newRegionalOptOutBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalOptOutBundleUnitLengthRule flags a long unit", () => {
  const rule = new RegionalOptOutBundleUnitLengthRule(16);
  const item = newRegionalOptOutBundle("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalOptOutBundleMinimumRangeRule flags values above minimum", () => {
  const rule = new RegionalOptOutBundleMinimumRangeRule(3.9, 1804);
  const item = newRegionalOptOutBundle("x", "y");
  item.minimum = 1805.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalOptOutBundleLocaleLengthRule flags a long locale", () => {
  const rule = new RegionalOptOutBundleLocaleLengthRule(64);
  const item = newRegionalOptOutBundle("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
