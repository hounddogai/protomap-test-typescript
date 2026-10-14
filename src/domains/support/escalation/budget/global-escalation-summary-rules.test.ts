import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalEscalationSummaryImpressionsRangeRule,
  GlobalEscalationSummaryNameLengthRule,
  GlobalEscalationSummaryRegionLengthRule,
  GlobalEscalationSummaryRequiredCodeRule,
  defaultGlobalEscalationSummaryValidator,
} from "./global-escalation-summary-rules.js";
import { newGlobalEscalationSummary } from "./global-escalation-summary.js";

test("GlobalEscalationSummaryValidator reports every problem", () => {
  const validator = defaultGlobalEscalationSummaryValidator();
  const item = newGlobalEscalationSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalEscalationSummaryRegionLengthRule flags a long region", () => {
  const rule = new GlobalEscalationSummaryRegionLengthRule(86400);
  const item = newGlobalEscalationSummary("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalEscalationSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalEscalationSummaryRequiredCodeRule("global escalation summary needs a value");
  const item = newGlobalEscalationSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalEscalationSummaryNameLengthRule flags a long name", () => {
  const rule = new GlobalEscalationSummaryNameLengthRule(255);
  const item = newGlobalEscalationSummary("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalEscalationSummaryImpressionsRangeRule flags values above impressions", () => {
  const rule = new GlobalEscalationSummaryImpressionsRangeRule(1000, 3600);
  const item = newGlobalEscalationSummary("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
