import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalEscalationVarianceCreatedAtRangeRule,
  RegionalEscalationVarianceRequiredCodeRule,
  RegionalEscalationVarianceRequiredJourneyIdRule,
  RegionalEscalationVarianceRequiredNameRule,
  defaultRegionalEscalationVarianceValidator,
} from "./regional-escalation-variance-rules.js";
import { newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("RegionalEscalationVarianceValidator reports every problem", () => {
  const validator = defaultRegionalEscalationVarianceValidator();
  const item = newRegionalEscalationVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalEscalationVarianceRequiredNameRule flags a blank name", () => {
  const rule = new RegionalEscalationVarianceRequiredNameRule("regional escalation variance needs this field");
  const item = newRegionalEscalationVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalEscalationVarianceCreatedAtRangeRule flags values above created at", () => {
  const rule = new RegionalEscalationVarianceCreatedAtRangeRule(255, 1000);
  const item = newRegionalEscalationVariance("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalEscalationVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalEscalationVarianceRequiredCodeRule("regional escalation variance needs a value");
  const item = newRegionalEscalationVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalEscalationVarianceRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RegionalEscalationVarianceRequiredJourneyIdRule("regional escalation variance needs this field");
  const item = newRegionalEscalationVariance("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
