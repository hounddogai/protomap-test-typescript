import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryCreditBundleAttemptsRangeRule,
  PrimaryCreditBundleCohortLengthRule,
  PrimaryCreditBundleImpressionsRangeRule,
  PrimaryCreditBundleNameLengthRule,
  PrimaryCreditBundleRequiredCodeRule,
  PrimaryCreditBundleTitleLengthRule,
  defaultPrimaryCreditBundleValidator,
} from "./primary-credit-bundle-rules.js";
import { newPrimaryCreditBundle } from "./primary-credit-bundle.js";

test("PrimaryCreditBundleValidator reports every problem", () => {
  const validator = defaultPrimaryCreditBundleValidator();
  const item = newPrimaryCreditBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryCreditBundleImpressionsRangeRule flags values above impressions", () => {
  const rule = new PrimaryCreditBundleImpressionsRangeRule(32, 255);
  const item = newPrimaryCreditBundle("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryCreditBundleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryCreditBundleRequiredCodeRule("primary credit bundle needs a value");
  const item = newPrimaryCreditBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCreditBundleNameLengthRule flags a long name", () => {
  const rule = new PrimaryCreditBundleNameLengthRule(255);
  const item = newPrimaryCreditBundle("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCreditBundleAttemptsRangeRule flags values above attempts", () => {
  const rule = new PrimaryCreditBundleAttemptsRangeRule(16, 3600);
  const item = newPrimaryCreditBundle("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryCreditBundleTitleLengthRule flags a long title", () => {
  const rule = new PrimaryCreditBundleTitleLengthRule(120);
  const item = newPrimaryCreditBundle("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCreditBundleCohortLengthRule flags a long cohort", () => {
  const rule = new PrimaryCreditBundleCohortLengthRule(16);
  const item = newPrimaryCreditBundle("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
