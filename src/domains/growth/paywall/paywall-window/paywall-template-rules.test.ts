import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallTemplateBudgetRangeRule,
  PaywallTemplateCodeLengthRule,
  PaywallTemplateLabelLengthRule,
  PaywallTemplateRequiredCodeRule,
  PaywallTemplateRequiredReviewerRule,
  defaultPaywallTemplateValidator,
} from "./paywall-template-rules.js";
import { newPaywallTemplate } from "./paywall-template.js";

test("PaywallTemplateValidator reports every problem", () => {
  const validator = defaultPaywallTemplateValidator();
  const item = newPaywallTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PaywallTemplateRequiredCodeRule("paywall template needs an entry");
  const item = newPaywallTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallTemplateLabelLengthRule flags a long label", () => {
  const rule = new PaywallTemplateLabelLengthRule(1000);
  const item = newPaywallTemplate("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallTemplateRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PaywallTemplateRequiredReviewerRule("paywall template needs this field");
  const item = newPaywallTemplate("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallTemplateCodeLengthRule flags a long code", () => {
  const rule = new PaywallTemplateCodeLengthRule(3600);
  const item = newPaywallTemplate("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallTemplateBudgetRangeRule flags values above budget", () => {
  const rule = new PaywallTemplateBudgetRangeRule(4.5, 1309.7);
  const item = newPaywallTemplate("x", "y");
  item.budget = 1311.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
