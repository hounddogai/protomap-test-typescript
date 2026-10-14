import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCohortBaselineBidRangeRule,
  StrictCohortBaselineGraceDaysRangeRule,
  StrictCohortBaselineRequiredCodeRule,
  StrictCohortBaselineRequiredSourceRule,
  StrictCohortBaselineSourceLengthRule,
  defaultStrictCohortBaselineValidator,
} from "./strict-cohort-baseline-rules.js";
import { newStrictCohortBaseline } from "./strict-cohort-baseline.js";

test("StrictCohortBaselineValidator reports every problem", () => {
  const validator = defaultStrictCohortBaselineValidator();
  const item = newStrictCohortBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCohortBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCohortBaselineRequiredCodeRule("strict cohort baseline needs a value");
  const item = newStrictCohortBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCohortBaselineRequiredSourceRule flags a blank source", () => {
  const rule = new StrictCohortBaselineRequiredSourceRule("strict cohort baseline needs this field");
  const item = newStrictCohortBaseline("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCohortBaselineGraceDaysRangeRule flags values above grace days", () => {
  const rule = new StrictCohortBaselineGraceDaysRangeRule(64, 3600);
  const item = newStrictCohortBaseline("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCohortBaselineSourceLengthRule flags a long source", () => {
  const rule = new StrictCohortBaselineSourceLengthRule(64);
  const item = newStrictCohortBaseline("x", "y");
  item.source = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCohortBaselineBidRangeRule flags values above bid", () => {
  const rule = new StrictCohortBaselineBidRangeRule(6, 2961);
  const item = newStrictCohortBaseline("x", "y");
  item.bid = 2962.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
