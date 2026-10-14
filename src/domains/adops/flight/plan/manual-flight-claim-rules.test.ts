import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFlightClaimAmountRangeRule,
  ManualFlightClaimDiscountRangeRule,
  ManualFlightClaimRequiredNameRule,
  defaultManualFlightClaimValidator,
} from "./manual-flight-claim-rules.js";
import { newManualFlightClaim } from "./manual-flight-claim.js";

test("ManualFlightClaimValidator reports every problem", () => {
  const validator = defaultManualFlightClaimValidator();
  const item = newManualFlightClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFlightClaimAmountRangeRule flags values above amount", () => {
  const rule = new ManualFlightClaimAmountRangeRule(5.1, 1925.8);
  const item = newManualFlightClaim("x", "y");
  item.amount = 1927.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFlightClaimDiscountRangeRule flags values above discount", () => {
  const rule = new ManualFlightClaimDiscountRangeRule(5.2, 3700.2);
  const item = newManualFlightClaim("x", "y");
  item.discount = 3701.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFlightClaimRequiredNameRule flags a blank name", () => {
  const rule = new ManualFlightClaimRequiredNameRule("manual flight claim needs an entry");
  const item = newManualFlightClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
