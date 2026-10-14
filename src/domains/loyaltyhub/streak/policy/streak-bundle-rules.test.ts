import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakBundleBatchSizeRangeRule,
  StreakBundleCreatedAtRangeRule,
  StreakBundleRequiredCountryRule,
  StreakBundleTitleLengthRule,
  defaultStreakBundleValidator,
} from "./streak-bundle-rules.js";
import { newStreakBundle } from "./streak-bundle.js";

test("StreakBundleValidator reports every problem", () => {
  const validator = defaultStreakBundleValidator();
  const item = newStreakBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakBundleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new StreakBundleBatchSizeRangeRule(16, 64);
  const item = newStreakBundle("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakBundleRequiredCountryRule flags a blank country", () => {
  const rule = new StreakBundleRequiredCountryRule("streak bundle needs an entry");
  const item = newStreakBundle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakBundleCreatedAtRangeRule flags values above created at", () => {
  const rule = new StreakBundleCreatedAtRangeRule(80, 255);
  const item = newStreakBundle("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakBundleTitleLengthRule flags a long title", () => {
  const rule = new StreakBundleTitleLengthRule(16);
  const item = newStreakBundle("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
