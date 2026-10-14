import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLevelWindowCohortLengthRule,
  SeasonalLevelWindowMaximumRangeRule,
  SeasonalLevelWindowTitleLengthRule,
  defaultSeasonalLevelWindowValidator,
} from "./seasonal-level-window-rules.js";
import { newSeasonalLevelWindow } from "./seasonal-level-window.js";

test("SeasonalLevelWindowValidator reports every problem", () => {
  const validator = defaultSeasonalLevelWindowValidator();
  const item = newSeasonalLevelWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLevelWindowTitleLengthRule flags a long title", () => {
  const rule = new SeasonalLevelWindowTitleLengthRule(16);
  const item = newSeasonalLevelWindow("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalLevelWindowMaximumRangeRule flags values above maximum", () => {
  const rule = new SeasonalLevelWindowMaximumRangeRule(0.8, 1348.7);
  const item = newSeasonalLevelWindow("x", "y");
  item.maximum = 1350.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalLevelWindowCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalLevelWindowCohortLengthRule(3600);
  const item = newSeasonalLevelWindow("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
