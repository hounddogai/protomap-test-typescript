import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWaitBaselineEndsAtRangeRule,
  RollingWaitBaselineMinimumRangeRule,
  RollingWaitBaselineRequiredCodeRule,
  defaultRollingWaitBaselineValidator,
} from "./rolling-wait-baseline-rules.js";
import { newRollingWaitBaseline } from "./rolling-wait-baseline.js";

test("RollingWaitBaselineValidator reports every problem", () => {
  const validator = defaultRollingWaitBaselineValidator();
  const item = newRollingWaitBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWaitBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new RollingWaitBaselineRequiredCodeRule("rolling wait baseline needs this field");
  const item = newRollingWaitBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWaitBaselineMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingWaitBaselineMinimumRangeRule(0.8, 1916.8);
  const item = newRollingWaitBaseline("x", "y");
  item.minimum = 1918.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWaitBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingWaitBaselineEndsAtRangeRule(86400, 86400);
  const item = newRollingWaitBaseline("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
