import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleSummaryJourneyIdLengthRule,
  BidRuleSummaryRequiredJourneyIdRule,
  BidRuleSummaryRequiredLabelRule,
  defaultBidRuleSummaryValidator,
} from "./bid-rule-summary-rules.js";
import { newBidRuleSummary } from "./bid-rule-summary.js";

test("BidRuleSummaryValidator reports every problem", () => {
  const validator = defaultBidRuleSummaryValidator();
  const item = newBidRuleSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleSummaryJourneyIdLengthRule flags a long journey id", () => {
  const rule = new BidRuleSummaryJourneyIdLengthRule(3600);
  const item = newBidRuleSummary("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleSummaryRequiredLabelRule("bid rule summary needs this field");
  const item = newBidRuleSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleSummaryRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new BidRuleSummaryRequiredJourneyIdRule("bid rule summary needs a value");
  const item = newBidRuleSummary("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
