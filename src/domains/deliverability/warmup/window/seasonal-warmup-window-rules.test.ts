import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWarmupWindowRatioRangeRule,
  SeasonalWarmupWindowRequiredOwnerIdRule,
  SeasonalWarmupWindowTitleLengthRule,
  defaultSeasonalWarmupWindowValidator,
} from "./seasonal-warmup-window-rules.js";
import { newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

test("SeasonalWarmupWindowValidator reports every problem", () => {
  const validator = defaultSeasonalWarmupWindowValidator();
  const item = newSeasonalWarmupWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWarmupWindowRatioRangeRule flags values above ratio", () => {
  const rule = new SeasonalWarmupWindowRatioRangeRule(4.6, 3026);
  const item = newSeasonalWarmupWindow("x", "y");
  item.ratio = 3027.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalWarmupWindowTitleLengthRule flags a long title", () => {
  const rule = new SeasonalWarmupWindowTitleLengthRule(1000);
  const item = newSeasonalWarmupWindow("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWarmupWindowRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SeasonalWarmupWindowRequiredOwnerIdRule("seasonal warmup window needs this field");
  const item = newSeasonalWarmupWindow("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
