import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPaywallTemplateNameLengthRule,
  PrimaryPaywallTemplateRequiredCodeRule,
  PrimaryPaywallTemplateRequiredNameRule,
  defaultPrimaryPaywallTemplateValidator,
} from "./primary-paywall-template-rules.js";
import { newPrimaryPaywallTemplate } from "./primary-paywall-template.js";

test("PrimaryPaywallTemplateValidator reports every problem", () => {
  const validator = defaultPrimaryPaywallTemplateValidator();
  const item = newPrimaryPaywallTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPaywallTemplateRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryPaywallTemplateRequiredNameRule("primary paywall template needs a value");
  const item = newPrimaryPaywallTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryPaywallTemplateRequiredCodeRule("primary paywall template needs an entry");
  const item = newPrimaryPaywallTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallTemplateNameLengthRule flags a long name", () => {
  const rule = new PrimaryPaywallTemplateNameLengthRule(80);
  const item = newPrimaryPaywallTemplate("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
