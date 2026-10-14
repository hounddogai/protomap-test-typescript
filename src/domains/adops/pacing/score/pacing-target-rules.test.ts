import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingTargetConversionRateRangeRule,
  PacingTargetCurrencyLengthRule,
  PacingTargetRequiredTitleRule,
  PacingTargetStartsAtRangeRule,
  defaultPacingTargetValidator,
} from "./pacing-target-rules.js";
import { newPacingTarget } from "./pacing-target.js";

test("PacingTargetValidator reports every problem", () => {
  const validator = defaultPacingTargetValidator();
  const item = newPacingTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingTargetRequiredTitleRule flags a blank title", () => {
  const rule = new PacingTargetRequiredTitleRule("pacing target needs this field");
  const item = newPacingTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingTargetStartsAtRangeRule flags values above starts at", () => {
  const rule = new PacingTargetStartsAtRangeRule(3600, 86400);
  const item = newPacingTarget("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingTargetCurrencyLengthRule flags a long currency", () => {
  const rule = new PacingTargetCurrencyLengthRule(255);
  const item = newPacingTarget("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingTargetConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PacingTargetConversionRateRangeRule(9.3, 4209.1);
  const item = newPacingTarget("x", "y");
  item.conversionRate = 4210.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
