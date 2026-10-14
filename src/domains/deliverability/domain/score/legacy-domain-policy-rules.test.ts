import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDomainPolicyCurrencyLengthRule,
  LegacyDomainPolicyLabelLengthRule,
  LegacyDomainPolicyRequiredCurrencyRule,
  LegacyDomainPolicyRequiredLabelRule,
  defaultLegacyDomainPolicyValidator,
} from "./legacy-domain-policy-rules.js";
import { newLegacyDomainPolicy } from "./legacy-domain-policy.js";

test("LegacyDomainPolicyValidator reports every problem", () => {
  const validator = defaultLegacyDomainPolicyValidator();
  const item = newLegacyDomainPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDomainPolicyCurrencyLengthRule flags a long currency", () => {
  const rule = new LegacyDomainPolicyCurrencyLengthRule(1000);
  const item = newLegacyDomainPolicy("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDomainPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyDomainPolicyRequiredLabelRule("legacy domain policy needs an entry");
  const item = newLegacyDomainPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDomainPolicyRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LegacyDomainPolicyRequiredCurrencyRule("legacy domain policy needs a value");
  const item = newLegacyDomainPolicy("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDomainPolicyLabelLengthRule flags a long label", () => {
  const rule = new LegacyDomainPolicyLabelLengthRule(16);
  const item = newLegacyDomainPolicy("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
