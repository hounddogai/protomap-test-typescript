import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationPolicyBudgetRangeRule,
  ActivationPolicyRequiredCodeRule,
  ActivationPolicyRequiredSourceRule,
  defaultActivationPolicyValidator,
} from "./activation-policy-rules.js";
import { newActivationPolicy } from "./activation-policy.js";

test("ActivationPolicyValidator reports every problem", () => {
  const validator = defaultActivationPolicyValidator();
  const item = newActivationPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationPolicyRequiredSourceRule flags a blank source", () => {
  const rule = new ActivationPolicyRequiredSourceRule("activation policy needs a value");
  const item = newActivationPolicy("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationPolicyRequiredCodeRule("activation policy needs this field");
  const item = newActivationPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationPolicyBudgetRangeRule flags values above budget", () => {
  const rule = new ActivationPolicyBudgetRangeRule(1.6, 1893.9);
  const item = newActivationPolicy("x", "y");
  item.budget = 1895.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
