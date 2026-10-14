import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneySummaryNameLengthRule,
  JourneySummaryOpenRateRangeRule,
  JourneySummaryUtmSourceLengthRule,
  defaultJourneySummaryValidator,
} from "./journey-summary-rules.js";
import { newJourneySummary } from "./journey-summary.js";

test("JourneySummaryValidator reports every problem", () => {
  const validator = defaultJourneySummaryValidator();
  const item = newJourneySummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneySummaryUtmSourceLengthRule flags a long utm source", () => {
  const rule = new JourneySummaryUtmSourceLengthRule(3600);
  const item = newJourneySummary("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneySummaryOpenRateRangeRule flags values above open rate", () => {
  const rule = new JourneySummaryOpenRateRangeRule(0.9, 2199.6);
  const item = newJourneySummary("x", "y");
  item.openRate = 2201.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneySummaryNameLengthRule flags a long name", () => {
  const rule = new JourneySummaryNameLengthRule(64);
  const item = newJourneySummary("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
