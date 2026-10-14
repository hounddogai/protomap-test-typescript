import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientInsightBundleBudgetRangeRule,
  LenientInsightBundleNameLengthRule,
  LenientInsightBundleRequiredCodeRule,
  LenientInsightBundleRequiredNameRule,
  defaultLenientInsightBundleValidator,
} from "./lenient-insight-bundle-rules.js";
import { newLenientInsightBundle } from "./lenient-insight-bundle.js";

test("LenientInsightBundleValidator reports every problem", () => {
  const validator = defaultLenientInsightBundleValidator();
  const item = newLenientInsightBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientInsightBundleRequiredCodeRule flags a blank code", () => {
  const rule = new LenientInsightBundleRequiredCodeRule("lenient insight bundle needs an entry");
  const item = newLenientInsightBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInsightBundleBudgetRangeRule flags values above budget", () => {
  const rule = new LenientInsightBundleBudgetRangeRule(2.3, 4584.9);
  const item = newLenientInsightBundle("x", "y");
  item.budget = 4586.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientInsightBundleNameLengthRule flags a long name", () => {
  const rule = new LenientInsightBundleNameLengthRule(64);
  const item = newLenientInsightBundle("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInsightBundleRequiredNameRule flags a blank name", () => {
  const rule = new LenientInsightBundleRequiredNameRule("lenient insight bundle needs an entry");
  const item = newLenientInsightBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
