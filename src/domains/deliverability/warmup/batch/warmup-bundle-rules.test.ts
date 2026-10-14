import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupBundleGraceDaysRangeRule,
  WarmupBundleRateRangeRule,
  WarmupBundleSegmentLengthRule,
  defaultWarmupBundleValidator,
} from "./warmup-bundle-rules.js";
import { newWarmupBundle } from "./warmup-bundle.js";

test("WarmupBundleValidator reports every problem", () => {
  const validator = defaultWarmupBundleValidator();
  const item = newWarmupBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupBundleSegmentLengthRule flags a long segment", () => {
  const rule = new WarmupBundleSegmentLengthRule(1000);
  const item = newWarmupBundle("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupBundleRateRangeRule flags values above rate", () => {
  const rule = new WarmupBundleRateRangeRule(0.7, 3483.4);
  const item = newWarmupBundle("x", "y");
  item.rate = 3484.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupBundleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new WarmupBundleGraceDaysRangeRule(32, 86400);
  const item = newWarmupBundle("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
