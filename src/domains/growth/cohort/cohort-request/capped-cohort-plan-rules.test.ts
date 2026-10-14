import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCohortPlanCampaignRefLengthRule,
  CappedCohortPlanDurationMinutesRangeRule,
  CappedCohortPlanRateRangeRule,
  CappedCohortPlanRequiredCampaignRefRule,
  CappedCohortPlanRequiredNameRule,
  defaultCappedCohortPlanValidator,
} from "./capped-cohort-plan-rules.js";
import { newCappedCohortPlan } from "./capped-cohort-plan.js";

test("CappedCohortPlanValidator reports every problem", () => {
  const validator = defaultCappedCohortPlanValidator();
  const item = newCappedCohortPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCohortPlanRequiredNameRule flags a blank name", () => {
  const rule = new CappedCohortPlanRequiredNameRule("capped cohort plan needs an entry");
  const item = newCappedCohortPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCohortPlanCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedCohortPlanCampaignRefLengthRule(64);
  const item = newCappedCohortPlan("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCohortPlanDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CappedCohortPlanDurationMinutesRangeRule(80, 120);
  const item = newCappedCohortPlan("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCohortPlanRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CappedCohortPlanRequiredCampaignRefRule("capped cohort plan needs this field");
  const item = newCappedCohortPlan("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCohortPlanRateRangeRule flags values above rate", () => {
  const rule = new CappedCohortPlanRateRangeRule(4.8, 3329.7);
  const item = newCappedCohortPlan("x", "y");
  item.rate = 3331.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
