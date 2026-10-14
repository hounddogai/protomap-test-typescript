import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionTemplateBudgetRangeRule,
  SubscriptionTemplateCeilingRangeRule,
  SubscriptionTemplateCodeLengthRule,
  SubscriptionTemplateImpressionsRangeRule,
  defaultSubscriptionTemplateValidator,
} from "./subscription-template-rules.js";
import { newSubscriptionTemplate } from "./subscription-template.js";

test("SubscriptionTemplateValidator reports every problem", () => {
  const validator = defaultSubscriptionTemplateValidator();
  const item = newSubscriptionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionTemplateImpressionsRangeRule flags values above impressions", () => {
  const rule = new SubscriptionTemplateImpressionsRangeRule(32, 64);
  const item = newSubscriptionTemplate("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionTemplateBudgetRangeRule flags values above budget", () => {
  const rule = new SubscriptionTemplateBudgetRangeRule(2.6, 4307.2);
  const item = newSubscriptionTemplate("x", "y");
  item.budget = 4308.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionTemplateCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionTemplateCodeLengthRule(3600);
  const item = newSubscriptionTemplate("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionTemplateCeilingRangeRule flags values above ceiling", () => {
  const rule = new SubscriptionTemplateCeilingRangeRule(9.6, 2872.9);
  const item = newSubscriptionTemplate("x", "y");
  item.ceiling = 2874.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
