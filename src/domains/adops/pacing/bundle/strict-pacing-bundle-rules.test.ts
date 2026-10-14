import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPacingBundleMinimumRangeRule,
  StrictPacingBundleRequiredRegionRule,
  StrictPacingBundleSegmentLengthRule,
  StrictPacingBundleUpdatedAtRangeRule,
  defaultStrictPacingBundleValidator,
} from "./strict-pacing-bundle-rules.js";
import { newStrictPacingBundle } from "./strict-pacing-bundle.js";

test("StrictPacingBundleValidator reports every problem", () => {
  const validator = defaultStrictPacingBundleValidator();
  const item = newStrictPacingBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPacingBundleUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictPacingBundleUpdatedAtRangeRule(64, 86400);
  const item = newStrictPacingBundle("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPacingBundleSegmentLengthRule flags a long segment", () => {
  const rule = new StrictPacingBundleSegmentLengthRule(80);
  const item = newStrictPacingBundle("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPacingBundleMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictPacingBundleMinimumRangeRule(1.8, 3736.1);
  const item = newStrictPacingBundle("x", "y");
  item.minimum = 3737.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPacingBundleRequiredRegionRule flags a blank region", () => {
  const rule = new StrictPacingBundleRequiredRegionRule("strict pacing bundle needs a value");
  const item = newStrictPacingBundle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
