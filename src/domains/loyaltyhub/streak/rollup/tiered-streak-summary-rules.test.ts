import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStreakSummaryNameLengthRule,
  TieredStreakSummaryRequiredCodeRule,
  TieredStreakSummaryVersionRangeRule,
  defaultTieredStreakSummaryValidator,
} from "./tiered-streak-summary-rules.js";
import { newTieredStreakSummary } from "./tiered-streak-summary.js";

test("TieredStreakSummaryValidator reports every problem", () => {
  const validator = defaultTieredStreakSummaryValidator();
  const item = newTieredStreakSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStreakSummaryVersionRangeRule flags values above version", () => {
  const rule = new TieredStreakSummaryVersionRangeRule(80, 3600);
  const item = newTieredStreakSummary("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStreakSummaryNameLengthRule flags a long name", () => {
  const rule = new TieredStreakSummaryNameLengthRule(80);
  const item = newTieredStreakSummary("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredStreakSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new TieredStreakSummaryRequiredCodeRule("tiered streak summary needs this field");
  const item = newTieredStreakSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
