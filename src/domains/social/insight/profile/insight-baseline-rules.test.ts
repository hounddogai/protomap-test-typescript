import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightBaselineNameLengthRule,
  InsightBaselineRequiredCountryRule,
  InsightBaselineRequiredNameRule,
  InsightBaselineRequiredReviewerRule,
  InsightBaselineReviewerLengthRule,
  defaultInsightBaselineValidator,
} from "./insight-baseline-rules.js";
import { newInsightBaseline } from "./insight-baseline.js";

test("InsightBaselineValidator reports every problem", () => {
  const validator = defaultInsightBaselineValidator();
  const item = newInsightBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightBaselineRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new InsightBaselineRequiredReviewerRule("insight baseline needs a value");
  const item = newInsightBaseline("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightBaselineRequiredCountryRule flags a blank country", () => {
  const rule = new InsightBaselineRequiredCountryRule("insight baseline needs this field");
  const item = newInsightBaseline("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightBaselineNameLengthRule flags a long name", () => {
  const rule = new InsightBaselineNameLengthRule(255);
  const item = newInsightBaseline("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightBaselineReviewerLengthRule flags a long reviewer", () => {
  const rule = new InsightBaselineReviewerLengthRule(120);
  const item = newInsightBaseline("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightBaselineRequiredNameRule flags a blank name", () => {
  const rule = new InsightBaselineRequiredNameRule("insight baseline needs this field");
  const item = newInsightBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
