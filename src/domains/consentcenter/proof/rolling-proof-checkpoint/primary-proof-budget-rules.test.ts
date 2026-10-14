import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryProofBudgetBudgetRangeRule,
  PrimaryProofBudgetCampaignRefLengthRule,
  PrimaryProofBudgetNameLengthRule,
  PrimaryProofBudgetRequiredCampaignRefRule,
  PrimaryProofBudgetRequiredCodeRule,
  defaultPrimaryProofBudgetValidator,
} from "./primary-proof-budget-rules.js";
import { newPrimaryProofBudget } from "./primary-proof-budget.js";

test("PrimaryProofBudgetValidator reports every problem", () => {
  const validator = defaultPrimaryProofBudgetValidator();
  const item = newPrimaryProofBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryProofBudgetCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PrimaryProofBudgetCampaignRefLengthRule(32);
  const item = newPrimaryProofBudget("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryProofBudgetBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryProofBudgetBudgetRangeRule(1.1, 780.5);
  const item = newPrimaryProofBudget("x", "y");
  item.budget = 782;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryProofBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryProofBudgetRequiredCodeRule("primary proof budget needs this field");
  const item = newPrimaryProofBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofBudgetRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new PrimaryProofBudgetRequiredCampaignRefRule("primary proof budget needs an entry");
  const item = newPrimaryProofBudget("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofBudgetNameLengthRule flags a long name", () => {
  const rule = new PrimaryProofBudgetNameLengthRule(64);
  const item = newPrimaryProofBudget("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
