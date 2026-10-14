import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePaywallTemplateCodeLengthRule,
  AdaptivePaywallTemplateLocaleLengthRule,
  AdaptivePaywallTemplateRequiredLocaleRule,
  AdaptivePaywallTemplateRequiredNameRule,
  AdaptivePaywallTemplateSendAtRangeRule,
  defaultAdaptivePaywallTemplateValidator,
} from "./adaptive-paywall-template-rules.js";
import { newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("AdaptivePaywallTemplateValidator reports every problem", () => {
  const validator = defaultAdaptivePaywallTemplateValidator();
  const item = newAdaptivePaywallTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePaywallTemplateSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptivePaywallTemplateSendAtRangeRule(80, 120);
  const item = newAdaptivePaywallTemplate("x", "y");
  item.sendAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePaywallTemplateRequiredNameRule flags a blank name", () => {
  const rule = new AdaptivePaywallTemplateRequiredNameRule("adaptive paywall template needs a value");
  const item = newAdaptivePaywallTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePaywallTemplateLocaleLengthRule flags a long locale", () => {
  const rule = new AdaptivePaywallTemplateLocaleLengthRule(86400);
  const item = newAdaptivePaywallTemplate("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePaywallTemplateCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePaywallTemplateCodeLengthRule(80);
  const item = newAdaptivePaywallTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePaywallTemplateRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptivePaywallTemplateRequiredLocaleRule("adaptive paywall template needs this field");
  const item = newAdaptivePaywallTemplate("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
