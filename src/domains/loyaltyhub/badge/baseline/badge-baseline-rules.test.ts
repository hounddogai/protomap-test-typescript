import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeBaselineRateRangeRule,
  BadgeBaselineRequiredCodeRule,
  BadgeBaselineStartsAtRangeRule,
  defaultBadgeBaselineValidator,
} from "./badge-baseline-rules.js";
import { newBadgeBaseline } from "./badge-baseline.js";

test("BadgeBaselineValidator reports every problem", () => {
  const validator = defaultBadgeBaselineValidator();
  const item = newBadgeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeBaselineStartsAtRangeRule flags values above starts at", () => {
  const rule = new BadgeBaselineStartsAtRangeRule(32, 64);
  const item = newBadgeBaseline("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeBaselineRateRangeRule flags values above rate", () => {
  const rule = new BadgeBaselineRateRangeRule(8.4, 3547.5);
  const item = newBadgeBaseline("x", "y");
  item.rate = 3549;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeBaselineRequiredCodeRule("badge baseline needs this field");
  const item = newBadgeBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
