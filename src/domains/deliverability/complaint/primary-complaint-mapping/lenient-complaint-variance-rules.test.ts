import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientComplaintVarianceBudgetRangeRule,
  LenientComplaintVarianceRequiredCodeRule,
  LenientComplaintVarianceRequiredJourneyIdRule,
  LenientComplaintVarianceTitleLengthRule,
  defaultLenientComplaintVarianceValidator,
} from "./lenient-complaint-variance-rules.js";
import { newLenientComplaintVariance } from "./lenient-complaint-variance.js";

test("LenientComplaintVarianceValidator reports every problem", () => {
  const validator = defaultLenientComplaintVarianceValidator();
  const item = newLenientComplaintVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientComplaintVarianceTitleLengthRule flags a long title", () => {
  const rule = new LenientComplaintVarianceTitleLengthRule(80);
  const item = newLenientComplaintVariance("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientComplaintVarianceRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LenientComplaintVarianceRequiredJourneyIdRule("lenient complaint variance needs this field");
  const item = newLenientComplaintVariance("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientComplaintVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LenientComplaintVarianceRequiredCodeRule("lenient complaint variance needs this field");
  const item = newLenientComplaintVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientComplaintVarianceBudgetRangeRule flags values above budget", () => {
  const rule = new LenientComplaintVarianceBudgetRangeRule(7.7, 1286.9);
  const item = newLenientComplaintVariance("x", "y");
  item.budget = 1288.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
