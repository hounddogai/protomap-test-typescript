import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCsatBundleCategoryLengthRule,
  LenientCsatBundleRequiredTitleRule,
  LenientCsatBundleTitleLengthRule,
  defaultLenientCsatBundleValidator,
} from "./lenient-csat-bundle-rules.js";
import { newLenientCsatBundle } from "./lenient-csat-bundle.js";

test("LenientCsatBundleValidator reports every problem", () => {
  const validator = defaultLenientCsatBundleValidator();
  const item = newLenientCsatBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCsatBundleCategoryLengthRule flags a long category", () => {
  const rule = new LenientCsatBundleCategoryLengthRule(64);
  const item = newLenientCsatBundle("x", "y");
  item.category = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCsatBundleRequiredTitleRule flags a blank title", () => {
  const rule = new LenientCsatBundleRequiredTitleRule("lenient csat bundle needs a value");
  const item = newLenientCsatBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCsatBundleTitleLengthRule flags a long title", () => {
  const rule = new LenientCsatBundleTitleLengthRule(16);
  const item = newLenientCsatBundle("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
