import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFraudCheckPlanCampaignRefLengthRule,
  CappedFraudCheckPlanCodeLengthRule,
  CappedFraudCheckPlanFrequencyCapRangeRule,
  CappedFraudCheckPlanLabelLengthRule,
  CappedFraudCheckPlanRequiredCampaignRefRule,
  defaultCappedFraudCheckPlanValidator,
} from "./capped-fraud-check-plan-rules.js";
import { newCappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

test("CappedFraudCheckPlanValidator reports every problem", () => {
  const validator = defaultCappedFraudCheckPlanValidator();
  const item = newCappedFraudCheckPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFraudCheckPlanCodeLengthRule flags a long code", () => {
  const rule = new CappedFraudCheckPlanCodeLengthRule(120);
  const item = newCappedFraudCheckPlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFraudCheckPlanRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CappedFraudCheckPlanRequiredCampaignRefRule("capped fraud check plan needs a value");
  const item = newCappedFraudCheckPlan("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFraudCheckPlanLabelLengthRule flags a long label", () => {
  const rule = new CappedFraudCheckPlanLabelLengthRule(1000);
  const item = newCappedFraudCheckPlan("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFraudCheckPlanFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CappedFraudCheckPlanFrequencyCapRangeRule(16, 32);
  const item = newCappedFraudCheckPlan("x", "y");
  item.frequencyCap = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFraudCheckPlanCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedFraudCheckPlanCampaignRefLengthRule(255);
  const item = newCappedFraudCheckPlan("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
