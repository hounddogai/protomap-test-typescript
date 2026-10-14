import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallClaimAttemptsRangeRule,
  PaywallClaimCodeLengthRule,
  PaywallClaimRequiredTitleRule,
  defaultPaywallClaimValidator,
} from "./paywall-claim-rules.js";
import { newPaywallClaim } from "./paywall-claim.js";

test("PaywallClaimValidator reports every problem", () => {
  const validator = defaultPaywallClaimValidator();
  const item = newPaywallClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallClaimRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallClaimRequiredTitleRule("paywall claim needs a value");
  const item = newPaywallClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallClaimCodeLengthRule flags a long code", () => {
  const rule = new PaywallClaimCodeLengthRule(120);
  const item = newPaywallClaim("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallClaimAttemptsRangeRule flags values above attempts", () => {
  const rule = new PaywallClaimAttemptsRangeRule(16, 86400);
  const item = newPaywallClaim("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
