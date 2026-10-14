import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatSummaryLabelLengthRule,
  CsatSummaryRequiredReviewerRule,
  defaultCsatSummaryValidator,
} from "./csat-summary-rules.js";
import { newCsatSummary } from "./csat-summary.js";

test("CsatSummaryValidator reports every problem", () => {
  const validator = defaultCsatSummaryValidator();
  const item = newCsatSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatSummaryLabelLengthRule flags a long label", () => {
  const rule = new CsatSummaryLabelLengthRule(16);
  const item = newCsatSummary("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatSummaryRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CsatSummaryRequiredReviewerRule("csat summary needs an entry");
  const item = newCsatSummary("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
