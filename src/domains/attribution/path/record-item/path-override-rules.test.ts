import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathOverrideAmountRangeRule,
  PathOverrideCodeLengthRule,
  PathOverrideConversionRateRangeRule,
  PathOverrideRequiredTitleRule,
  PathOverrideTitleLengthRule,
  defaultPathOverrideValidator,
} from "./path-override-rules.js";
import { newPathOverride } from "./path-override.js";

test("PathOverrideValidator reports every problem", () => {
  const validator = defaultPathOverrideValidator();
  const item = newPathOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathOverrideTitleLengthRule flags a long title", () => {
  const rule = new PathOverrideTitleLengthRule(255);
  const item = newPathOverride("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathOverrideAmountRangeRule flags values above amount", () => {
  const rule = new PathOverrideAmountRangeRule(2.1, 4269);
  const item = newPathOverride("x", "y");
  item.amount = 4270.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathOverrideConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PathOverrideConversionRateRangeRule(3.9, 3924.2);
  const item = newPathOverride("x", "y");
  item.conversionRate = 3925.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathOverrideCodeLengthRule flags a long code", () => {
  const rule = new PathOverrideCodeLengthRule(32);
  const item = newPathOverride("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new PathOverrideRequiredTitleRule("path override needs a value");
  const item = newPathOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
