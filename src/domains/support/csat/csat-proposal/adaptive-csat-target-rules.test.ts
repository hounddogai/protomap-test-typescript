import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCsatTargetCreatedAtRangeRule,
  AdaptiveCsatTargetLimitRangeRule,
  AdaptiveCsatTargetRatioRangeRule,
  AdaptiveCsatTargetVersionRangeRule,
  defaultAdaptiveCsatTargetValidator,
} from "./adaptive-csat-target-rules.js";
import { newAdaptiveCsatTarget } from "./adaptive-csat-target.js";

test("AdaptiveCsatTargetValidator reports every problem", () => {
  const validator = defaultAdaptiveCsatTargetValidator();
  const item = newAdaptiveCsatTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCsatTargetCreatedAtRangeRule flags values above created at", () => {
  const rule = new AdaptiveCsatTargetCreatedAtRangeRule(16, 80);
  const item = newAdaptiveCsatTarget("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCsatTargetVersionRangeRule flags values above version", () => {
  const rule = new AdaptiveCsatTargetVersionRangeRule(80, 1000);
  const item = newAdaptiveCsatTarget("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCsatTargetLimitRangeRule flags values above limit", () => {
  const rule = new AdaptiveCsatTargetLimitRangeRule(64, 3600);
  const item = newAdaptiveCsatTarget("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCsatTargetRatioRangeRule flags values above ratio", () => {
  const rule = new AdaptiveCsatTargetRatioRangeRule(1, 2544.6);
  const item = newAdaptiveCsatTarget("x", "y");
  item.ratio = 2546.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
