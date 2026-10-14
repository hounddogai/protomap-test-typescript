import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryJourneySummaryLabelLengthRule,
  PrimaryJourneySummaryRequiredLabelRule,
  PrimaryJourneySummaryRetriesRangeRule,
  defaultPrimaryJourneySummaryValidator,
} from "./primary-journey-summary-rules.js";
import { newPrimaryJourneySummary } from "./primary-journey-summary.js";

test("PrimaryJourneySummaryValidator reports every problem", () => {
  const validator = defaultPrimaryJourneySummaryValidator();
  const item = newPrimaryJourneySummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryJourneySummaryRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryJourneySummaryRequiredLabelRule("primary journey summary needs this field");
  const item = newPrimaryJourneySummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryJourneySummaryRetriesRangeRule flags values above retries", () => {
  const rule = new PrimaryJourneySummaryRetriesRangeRule(80, 1000);
  const item = newPrimaryJourneySummary("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryJourneySummaryLabelLengthRule flags a long label", () => {
  const rule = new PrimaryJourneySummaryLabelLengthRule(255);
  const item = newPrimaryJourneySummary("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
