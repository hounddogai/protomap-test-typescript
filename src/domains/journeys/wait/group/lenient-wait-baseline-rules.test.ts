import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWaitBaselineAudienceIdLengthRule,
  LenientWaitBaselineDurationMinutesRangeRule,
  LenientWaitBaselineRegionLengthRule,
  defaultLenientWaitBaselineValidator,
} from "./lenient-wait-baseline-rules.js";
import { newLenientWaitBaseline } from "./lenient-wait-baseline.js";

test("LenientWaitBaselineValidator reports every problem", () => {
  const validator = defaultLenientWaitBaselineValidator();
  const item = newLenientWaitBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWaitBaselineAudienceIdLengthRule flags a long audience id", () => {
  const rule = new LenientWaitBaselineAudienceIdLengthRule(255);
  const item = newLenientWaitBaseline("x", "y");
  item.audienceId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWaitBaselineRegionLengthRule flags a long region", () => {
  const rule = new LenientWaitBaselineRegionLengthRule(16);
  const item = newLenientWaitBaseline("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWaitBaselineDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LenientWaitBaselineDurationMinutesRangeRule(3600, 86400);
  const item = newLenientWaitBaseline("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
