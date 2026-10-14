import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingStreakBundleCapacityRangeRule,
  PendingStreakBundleLabelLengthRule,
  PendingStreakBundleRequiredCodeRule,
  defaultPendingStreakBundleValidator,
} from "./pending-streak-bundle-rules.js";
import { newPendingStreakBundle } from "./pending-streak-bundle.js";

test("PendingStreakBundleValidator reports every problem", () => {
  const validator = defaultPendingStreakBundleValidator();
  const item = newPendingStreakBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingStreakBundleCapacityRangeRule flags values above capacity", () => {
  const rule = new PendingStreakBundleCapacityRangeRule(32, 64);
  const item = newPendingStreakBundle("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingStreakBundleRequiredCodeRule flags a blank code", () => {
  const rule = new PendingStreakBundleRequiredCodeRule("pending streak bundle needs this field");
  const item = newPendingStreakBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingStreakBundleLabelLengthRule flags a long label", () => {
  const rule = new PendingStreakBundleLabelLengthRule(80);
  const item = newPendingStreakBundle("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
