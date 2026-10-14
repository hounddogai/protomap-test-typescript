import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPaywallClaimCodeLengthRule,
  ManualPaywallClaimLabelLengthRule,
  ManualPaywallClaimRequiredCategoryRule,
  defaultManualPaywallClaimValidator,
} from "./manual-paywall-claim-rules.js";
import { newManualPaywallClaim } from "./manual-paywall-claim.js";

test("ManualPaywallClaimValidator reports every problem", () => {
  const validator = defaultManualPaywallClaimValidator();
  const item = newManualPaywallClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPaywallClaimRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualPaywallClaimRequiredCategoryRule("manual paywall claim needs an entry");
  const item = newManualPaywallClaim("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPaywallClaimLabelLengthRule flags a long label", () => {
  const rule = new ManualPaywallClaimLabelLengthRule(80);
  const item = newManualPaywallClaim("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPaywallClaimCodeLengthRule flags a long code", () => {
  const rule = new ManualPaywallClaimCodeLengthRule(86400);
  const item = newManualPaywallClaim("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
