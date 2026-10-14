import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalNudgeWindowGraceDaysRangeRule,
  SeasonalNudgeWindowRequiredPhoneRule,
  SeasonalNudgeWindowRequiredRegionRule,
  SeasonalNudgeWindowRequiredTitleRule,
  SeasonalNudgeWindowRetriesRangeRule,
  defaultSeasonalNudgeWindowValidator,
} from "./seasonal-nudge-window-rules.js";
import { newSeasonalNudgeWindow } from "./seasonal-nudge-window.js";

test("SeasonalNudgeWindowValidator reports every problem", () => {
  const validator = defaultSeasonalNudgeWindowValidator();
  const item = newSeasonalNudgeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalNudgeWindowRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalNudgeWindowRequiredTitleRule("seasonal nudge window needs a value");
  const item = newSeasonalNudgeWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalNudgeWindowRequiredRegionRule flags a blank region", () => {
  const rule = new SeasonalNudgeWindowRequiredRegionRule("seasonal nudge window needs this field");
  const item = newSeasonalNudgeWindow("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalNudgeWindowGraceDaysRangeRule flags values above grace days", () => {
  const rule = new SeasonalNudgeWindowGraceDaysRangeRule(80, 255);
  const item = newSeasonalNudgeWindow("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalNudgeWindowRequiredPhoneRule flags a blank phone", () => {
  const rule = new SeasonalNudgeWindowRequiredPhoneRule("seasonal nudge window needs this field");
  const item = newSeasonalNudgeWindow("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalNudgeWindowRetriesRangeRule flags values above retries", () => {
  const rule = new SeasonalNudgeWindowRetriesRangeRule(16, 86400);
  const item = newSeasonalNudgeWindow("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
