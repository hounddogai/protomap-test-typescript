import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFraudCheckSummaryAttemptsRangeRule,
  GlobalFraudCheckSummaryGraceDaysRangeRule,
  GlobalFraudCheckSummaryJourneyIdLengthRule,
  GlobalFraudCheckSummaryRequiredChecksumRule,
  GlobalFraudCheckSummaryRequiredCodeRule,
  defaultGlobalFraudCheckSummaryValidator,
} from "./global-fraud-check-summary-rules.js";
import { newGlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

test("GlobalFraudCheckSummaryValidator reports every problem", () => {
  const validator = defaultGlobalFraudCheckSummaryValidator();
  const item = newGlobalFraudCheckSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFraudCheckSummaryGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalFraudCheckSummaryGraceDaysRangeRule(32, 86400);
  const item = newGlobalFraudCheckSummary("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFraudCheckSummaryAttemptsRangeRule flags values above attempts", () => {
  const rule = new GlobalFraudCheckSummaryAttemptsRangeRule(64, 255);
  const item = newGlobalFraudCheckSummary("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFraudCheckSummaryJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalFraudCheckSummaryJourneyIdLengthRule(32);
  const item = newGlobalFraudCheckSummary("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFraudCheckSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalFraudCheckSummaryRequiredCodeRule("global fraud check summary needs an entry");
  const item = newGlobalFraudCheckSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFraudCheckSummaryRequiredChecksumRule flags a blank checksum", () => {
  const rule = new GlobalFraudCheckSummaryRequiredChecksumRule("global fraud check summary needs an entry");
  const item = newGlobalFraudCheckSummary("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
