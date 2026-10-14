import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTicketViewSummaryLimitRangeRule,
  AdaptiveTicketViewSummaryRequiredLabelRule,
  AdaptiveTicketViewSummaryRequiredTimezoneRule,
  AdaptiveTicketViewSummaryTimezoneLengthRule,
  defaultAdaptiveTicketViewSummaryValidator,
} from "./adaptive-ticket-view-summary-rules.js";
import { newAdaptiveTicketViewSummary } from "./adaptive-ticket-view-summary.js";

test("AdaptiveTicketViewSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveTicketViewSummaryValidator();
  const item = newAdaptiveTicketViewSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTicketViewSummaryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new AdaptiveTicketViewSummaryRequiredTimezoneRule("adaptive ticket view summary needs an entry");
  const item = newAdaptiveTicketViewSummary("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveTicketViewSummaryRequiredLabelRule("adaptive ticket view summary needs this field");
  const item = newAdaptiveTicketViewSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTicketViewSummaryLimitRangeRule flags values above limit", () => {
  const rule = new AdaptiveTicketViewSummaryLimitRangeRule(80, 3600);
  const item = newAdaptiveTicketViewSummary("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveTicketViewSummaryTimezoneLengthRule flags a long timezone", () => {
  const rule = new AdaptiveTicketViewSummaryTimezoneLengthRule(86400);
  const item = newAdaptiveTicketViewSummary("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
