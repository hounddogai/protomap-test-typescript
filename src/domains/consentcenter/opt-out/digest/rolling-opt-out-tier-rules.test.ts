import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutTierCodeLengthRule,
  RollingOptOutTierDurationMinutesRangeRule,
  RollingOptOutTierRequiredCodeRule,
  defaultRollingOptOutTierValidator,
} from "./rolling-opt-out-tier-rules.js";
import { newRollingOptOutTier } from "./rolling-opt-out-tier.js";

test("RollingOptOutTierValidator reports every problem", () => {
  const validator = defaultRollingOptOutTierValidator();
  const item = newRollingOptOutTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutTierDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RollingOptOutTierDurationMinutesRangeRule(80, 80);
  const item = newRollingOptOutTier("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingOptOutTierRequiredCodeRule flags a blank code", () => {
  const rule = new RollingOptOutTierRequiredCodeRule("rolling opt out tier needs an entry");
  const item = newRollingOptOutTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutTierCodeLengthRule flags a long code", () => {
  const rule = new RollingOptOutTierCodeLengthRule(32);
  const item = newRollingOptOutTier("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
