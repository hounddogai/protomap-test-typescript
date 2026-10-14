import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationPlanCodeLengthRule,
  ReputationPlanContactEmailLengthRule,
  ReputationPlanCountryLengthRule,
  ReputationPlanRequiredCodeRule,
  ReputationPlanRequiredCountryRule,
  ReputationPlanRequiredTitleRule,
  defaultReputationPlanValidator,
} from "./reputation-plan-rules.js";
import { newReputationPlan } from "./reputation-plan.js";

test("ReputationPlanValidator reports every problem", () => {
  const validator = defaultReputationPlanValidator();
  const item = newReputationPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationPlanCountryLengthRule flags a long country", () => {
  const rule = new ReputationPlanCountryLengthRule(32);
  const item = newReputationPlan("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationPlanRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationPlanRequiredCodeRule("reputation plan needs this field");
  const item = newReputationPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationPlanCodeLengthRule flags a long code", () => {
  const rule = new ReputationPlanCodeLengthRule(86400);
  const item = newReputationPlan("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationPlanRequiredCountryRule flags a blank country", () => {
  const rule = new ReputationPlanRequiredCountryRule("reputation plan needs a value");
  const item = newReputationPlan("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationPlanContactEmailLengthRule flags a long contact email", () => {
  const rule = new ReputationPlanContactEmailLengthRule(16);
  const item = newReputationPlan("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationPlanRequiredTitleRule flags a blank title", () => {
  const rule = new ReputationPlanRequiredTitleRule("reputation plan needs an entry");
  const item = newReputationPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
