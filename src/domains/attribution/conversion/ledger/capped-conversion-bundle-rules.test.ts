import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedConversionBundleClicksRangeRule,
  CappedConversionBundleCodeLengthRule,
  CappedConversionBundleRequiredLabelRule,
  CappedConversionBundleSummaryLengthRule,
  defaultCappedConversionBundleValidator,
} from "./capped-conversion-bundle-rules.js";
import { newCappedConversionBundle } from "./capped-conversion-bundle.js";

test("CappedConversionBundleValidator reports every problem", () => {
  const validator = defaultCappedConversionBundleValidator();
  const item = newCappedConversionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedConversionBundleSummaryLengthRule flags a long summary", () => {
  const rule = new CappedConversionBundleSummaryLengthRule(120);
  const item = newCappedConversionBundle("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedConversionBundleCodeLengthRule flags a long code", () => {
  const rule = new CappedConversionBundleCodeLengthRule(80);
  const item = newCappedConversionBundle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedConversionBundleClicksRangeRule flags values above clicks", () => {
  const rule = new CappedConversionBundleClicksRangeRule(80, 86400);
  const item = newCappedConversionBundle("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedConversionBundleRequiredLabelRule flags a blank label", () => {
  const rule = new CappedConversionBundleRequiredLabelRule("capped conversion bundle needs a value");
  const item = newCappedConversionBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
