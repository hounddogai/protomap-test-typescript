import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTicketViewSummaryConversionRateRangeRule,
  LegacyTicketViewSummaryLocaleLengthRule,
  LegacyTicketViewSummaryRequiredLocaleRule,
  defaultLegacyTicketViewSummaryValidator,
} from "./legacy-ticket-view-summary-rules.js";
import { newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("LegacyTicketViewSummaryValidator reports every problem", () => {
  const validator = defaultLegacyTicketViewSummaryValidator();
  const item = newLegacyTicketViewSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTicketViewSummaryLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyTicketViewSummaryLocaleLengthRule(64);
  const item = newLegacyTicketViewSummary("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyTicketViewSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new LegacyTicketViewSummaryRequiredLocaleRule("legacy ticket view summary needs this field");
  const item = newLegacyTicketViewSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyTicketViewSummaryConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyTicketViewSummaryConversionRateRangeRule(8.3, 839.8);
  const item = newLegacyTicketViewSummary("x", "y");
  item.conversionRate = 841.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
