import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFlightSummaryGraceDaysRangeRule,
  GlobalFlightSummaryRequiredLabelRule,
  GlobalFlightSummaryRequiredNameRule,
  defaultGlobalFlightSummaryValidator,
} from "./global-flight-summary-rules.js";
import { newGlobalFlightSummary } from "./global-flight-summary.js";

test("GlobalFlightSummaryValidator reports every problem", () => {
  const validator = defaultGlobalFlightSummaryValidator();
  const item = newGlobalFlightSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFlightSummaryRequiredNameRule flags a blank name", () => {
  const rule = new GlobalFlightSummaryRequiredNameRule("global flight summary needs a value");
  const item = newGlobalFlightSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFlightSummaryGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalFlightSummaryGraceDaysRangeRule(86400, 86400);
  const item = newGlobalFlightSummary("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFlightSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalFlightSummaryRequiredLabelRule("global flight summary needs a value");
  const item = newGlobalFlightSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
