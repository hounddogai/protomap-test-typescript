import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreativeSummaryAttemptsRangeRule,
  SeasonalCreativeSummaryCodeLengthRule,
  SeasonalCreativeSummaryRequiredCodeRule,
  SeasonalCreativeSummaryRequiredTitleRule,
  defaultSeasonalCreativeSummaryValidator,
} from "./seasonal-creative-summary-rules.js";
import { newSeasonalCreativeSummary } from "./seasonal-creative-summary.js";

test("SeasonalCreativeSummaryValidator reports every problem", () => {
  const validator = defaultSeasonalCreativeSummaryValidator();
  const item = newSeasonalCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreativeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCreativeSummaryRequiredCodeRule("seasonal creative summary needs an entry");
  const item = newSeasonalCreativeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCreativeSummaryAttemptsRangeRule flags values above attempts", () => {
  const rule = new SeasonalCreativeSummaryAttemptsRangeRule(32, 32);
  const item = newSeasonalCreativeSummary("x", "y");
  item.attempts = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeSummaryCodeLengthRule flags a long code", () => {
  const rule = new SeasonalCreativeSummaryCodeLengthRule(32);
  const item = newSeasonalCreativeSummary("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCreativeSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalCreativeSummaryRequiredTitleRule("seasonal creative summary needs this field");
  const item = newSeasonalCreativeSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
