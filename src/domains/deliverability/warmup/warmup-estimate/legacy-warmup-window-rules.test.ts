import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWarmupWindowPriorityRangeRule,
  LegacyWarmupWindowRequiredNameRule,
  LegacyWarmupWindowReviewerLengthRule,
  defaultLegacyWarmupWindowValidator,
} from "./legacy-warmup-window-rules.js";
import { newLegacyWarmupWindow } from "./legacy-warmup-window.js";

test("LegacyWarmupWindowValidator reports every problem", () => {
  const validator = defaultLegacyWarmupWindowValidator();
  const item = newLegacyWarmupWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWarmupWindowReviewerLengthRule flags a long reviewer", () => {
  const rule = new LegacyWarmupWindowReviewerLengthRule(120);
  const item = newLegacyWarmupWindow("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWarmupWindowRequiredNameRule flags a blank name", () => {
  const rule = new LegacyWarmupWindowRequiredNameRule("legacy warmup window needs a value");
  const item = newLegacyWarmupWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWarmupWindowPriorityRangeRule flags values above priority", () => {
  const rule = new LegacyWarmupWindowPriorityRangeRule(80, 3600);
  const item = newLegacyWarmupWindow("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
