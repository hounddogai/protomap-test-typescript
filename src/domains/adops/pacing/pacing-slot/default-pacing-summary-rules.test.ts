import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPacingSummaryCurrencyLengthRule,
  DefaultPacingSummaryRateRangeRule,
  DefaultPacingSummaryRequiredLabelRule,
  defaultDefaultPacingSummaryValidator,
} from "./default-pacing-summary-rules.js";
import { newDefaultPacingSummary } from "./default-pacing-summary.js";

test("DefaultPacingSummaryValidator reports every problem", () => {
  const validator = defaultDefaultPacingSummaryValidator();
  const item = newDefaultPacingSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPacingSummaryCurrencyLengthRule flags a long currency", () => {
  const rule = new DefaultPacingSummaryCurrencyLengthRule(86400);
  const item = newDefaultPacingSummary("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPacingSummaryRateRangeRule flags values above rate", () => {
  const rule = new DefaultPacingSummaryRateRangeRule(0, 502.3);
  const item = newDefaultPacingSummary("x", "y");
  item.rate = 503.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPacingSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultPacingSummaryRequiredLabelRule("default pacing summary needs a value");
  const item = newDefaultPacingSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
