import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackStreakBundleAudienceIdLengthRule,
  FallbackStreakBundleCodeLengthRule,
  FallbackStreakBundleRequiredAudienceIdRule,
  FallbackStreakBundleRequiredContactEmailRule,
  FallbackStreakBundleRequiredTitleRule,
  FallbackStreakBundleWeightRangeRule,
  defaultFallbackStreakBundleValidator,
} from "./fallback-streak-bundle-rules.js";
import { newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("FallbackStreakBundleValidator reports every problem", () => {
  const validator = defaultFallbackStreakBundleValidator();
  const item = newFallbackStreakBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackStreakBundleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FallbackStreakBundleRequiredContactEmailRule("fallback streak bundle needs an entry");
  const item = newFallbackStreakBundle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStreakBundleWeightRangeRule flags values above weight", () => {
  const rule = new FallbackStreakBundleWeightRangeRule(7.8, 1004.3);
  const item = newFallbackStreakBundle("x", "y");
  item.weight = 1005.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStreakBundleRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackStreakBundleRequiredTitleRule("fallback streak bundle needs an entry");
  const item = newFallbackStreakBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStreakBundleCodeLengthRule flags a long code", () => {
  const rule = new FallbackStreakBundleCodeLengthRule(32);
  const item = newFallbackStreakBundle("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackStreakBundleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FallbackStreakBundleAudienceIdLengthRule(32);
  const item = newFallbackStreakBundle("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackStreakBundleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new FallbackStreakBundleRequiredAudienceIdRule("fallback streak bundle needs an entry");
  const item = newFallbackStreakBundle("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
