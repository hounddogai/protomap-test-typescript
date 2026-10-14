import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWaitWindowImpressionsRangeRule,
  RollingWaitWindowLabelLengthRule,
  RollingWaitWindowWindowDaysRangeRule,
  defaultRollingWaitWindowValidator,
} from "./rolling-wait-window-rules.js";
import { newRollingWaitWindow } from "./rolling-wait-window.js";

test("RollingWaitWindowValidator reports every problem", () => {
  const validator = defaultRollingWaitWindowValidator();
  const item = newRollingWaitWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWaitWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new RollingWaitWindowWindowDaysRangeRule(80, 120);
  const item = newRollingWaitWindow("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWaitWindowImpressionsRangeRule flags values above impressions", () => {
  const rule = new RollingWaitWindowImpressionsRangeRule(120, 1000);
  const item = newRollingWaitWindow("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWaitWindowLabelLengthRule flags a long label", () => {
  const rule = new RollingWaitWindowLabelLengthRule(64);
  const item = newRollingWaitWindow("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
