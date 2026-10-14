import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalWarmupVarianceCodeLengthRule,
  RegionalWarmupVarianceEndsAtRangeRule,
  RegionalWarmupVarianceGraceDaysRangeRule,
  RegionalWarmupVarianceRequiredCodeRule,
  RegionalWarmupVarianceRequiredTitleRule,
  RegionalWarmupVarianceTitleLengthRule,
  defaultRegionalWarmupVarianceValidator,
} from "./regional-warmup-variance-rules.js";
import { newRegionalWarmupVariance } from "./regional-warmup-variance.js";

test("RegionalWarmupVarianceValidator reports every problem", () => {
  const validator = defaultRegionalWarmupVarianceValidator();
  const item = newRegionalWarmupVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalWarmupVarianceTitleLengthRule flags a long title", () => {
  const rule = new RegionalWarmupVarianceTitleLengthRule(80);
  const item = newRegionalWarmupVariance("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalWarmupVarianceEndsAtRangeRule flags values above ends at", () => {
  const rule = new RegionalWarmupVarianceEndsAtRangeRule(1000, 86400);
  const item = newRegionalWarmupVariance("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalWarmupVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalWarmupVarianceRequiredTitleRule("regional warmup variance needs a value");
  const item = newRegionalWarmupVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWarmupVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalWarmupVarianceRequiredCodeRule("regional warmup variance needs an entry");
  const item = newRegionalWarmupVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalWarmupVarianceGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalWarmupVarianceGraceDaysRangeRule(80, 3600);
  const item = newRegionalWarmupVariance("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalWarmupVarianceCodeLengthRule flags a long code", () => {
  const rule = new RegionalWarmupVarianceCodeLengthRule(255);
  const item = newRegionalWarmupVariance("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
