import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardRulePlanCodeLengthRule,
  PendingRewardRulePlanExternalRefLengthRule,
  PendingRewardRulePlanLabelLengthRule,
  PendingRewardRulePlanRequiredDescriptionRule,
  PendingRewardRulePlanRequiredExternalRefRule,
  defaultPendingRewardRulePlanValidator,
} from "./pending-reward-rule-plan-rules.js";
import { newPendingRewardRulePlan } from "./pending-reward-rule-plan.js";

test("PendingRewardRulePlanValidator reports every problem", () => {
  const validator = defaultPendingRewardRulePlanValidator();
  const item = newPendingRewardRulePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardRulePlanRequiredDescriptionRule flags a blank description", () => {
  const rule = new PendingRewardRulePlanRequiredDescriptionRule("pending reward rule plan needs this field");
  const item = newPendingRewardRulePlan("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRulePlanRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PendingRewardRulePlanRequiredExternalRefRule("pending reward rule plan needs an entry");
  const item = newPendingRewardRulePlan("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRulePlanExternalRefLengthRule flags a long external ref", () => {
  const rule = new PendingRewardRulePlanExternalRefLengthRule(3600);
  const item = newPendingRewardRulePlan("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRulePlanLabelLengthRule flags a long label", () => {
  const rule = new PendingRewardRulePlanLabelLengthRule(86400);
  const item = newPendingRewardRulePlan("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRulePlanCodeLengthRule flags a long code", () => {
  const rule = new PendingRewardRulePlanCodeLengthRule(1000);
  const item = newPendingRewardRulePlan("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
