import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutClaimBidRangeRule,
  PayoutClaimPriorityRangeRule,
  PayoutClaimRequiredCodeRule,
  PayoutClaimRequiredLabelRule,
  PayoutClaimRequiredUnitRule,
  PayoutClaimUnitLengthRule,
  defaultPayoutClaimValidator,
} from "./payout-claim-rules.js";
import { newPayoutClaim } from "./payout-claim.js";

test("PayoutClaimValidator reports every problem", () => {
  const validator = defaultPayoutClaimValidator();
  const item = newPayoutClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutClaimRequiredLabelRule flags a blank label", () => {
  const rule = new PayoutClaimRequiredLabelRule("payout claim needs an entry");
  const item = newPayoutClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutClaimPriorityRangeRule flags values above priority", () => {
  const rule = new PayoutClaimPriorityRangeRule(32, 3600);
  const item = newPayoutClaim("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutClaimRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutClaimRequiredCodeRule("payout claim needs a value");
  const item = newPayoutClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutClaimUnitLengthRule flags a long unit", () => {
  const rule = new PayoutClaimUnitLengthRule(64);
  const item = newPayoutClaim("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutClaimRequiredUnitRule flags a blank unit", () => {
  const rule = new PayoutClaimRequiredUnitRule("payout claim needs a value");
  const item = newPayoutClaim("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutClaimBidRangeRule flags values above bid", () => {
  const rule = new PayoutClaimBidRangeRule(6.1, 4860.7);
  const item = newPayoutClaim("x", "y");
  item.bid = 4862.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
