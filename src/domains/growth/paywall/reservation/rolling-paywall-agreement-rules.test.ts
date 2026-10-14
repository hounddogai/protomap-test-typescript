import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPaywallAgreementCapacityRangeRule,
  RollingPaywallAgreementCodeLengthRule,
  RollingPaywallAgreementLabelLengthRule,
  RollingPaywallAgreementRequiredVariantRule,
  RollingPaywallAgreementVariantLengthRule,
  defaultRollingPaywallAgreementValidator,
} from "./rolling-paywall-agreement-rules.js";
import { newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("RollingPaywallAgreementValidator reports every problem", () => {
  const validator = defaultRollingPaywallAgreementValidator();
  const item = newRollingPaywallAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPaywallAgreementCodeLengthRule flags a long code", () => {
  const rule = new RollingPaywallAgreementCodeLengthRule(255);
  const item = newRollingPaywallAgreement("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPaywallAgreementVariantLengthRule flags a long variant", () => {
  const rule = new RollingPaywallAgreementVariantLengthRule(1000);
  const item = newRollingPaywallAgreement("x", "y");
  item.variant = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPaywallAgreementCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingPaywallAgreementCapacityRangeRule(32, 120);
  const item = newRollingPaywallAgreement("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPaywallAgreementRequiredVariantRule flags a blank variant", () => {
  const rule = new RollingPaywallAgreementRequiredVariantRule("rolling paywall agreement needs an entry");
  const item = newRollingPaywallAgreement("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPaywallAgreementLabelLengthRule flags a long label", () => {
  const rule = new RollingPaywallAgreementLabelLengthRule(80);
  const item = newRollingPaywallAgreement("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
