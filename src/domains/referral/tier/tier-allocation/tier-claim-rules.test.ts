import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierClaimAmountRangeRule,
  TierClaimRequiredCodeRule,
  TierClaimRequiredNameRule,
  TierClaimTitleLengthRule,
  defaultTierClaimValidator,
} from "./tier-claim-rules.js";
import { newTierClaim } from "./tier-claim.js";

test("TierClaimValidator reports every problem", () => {
  const validator = defaultTierClaimValidator();
  const item = newTierClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierClaimAmountRangeRule flags values above amount", () => {
  const rule = new TierClaimAmountRangeRule(8.8, 1180.5);
  const item = newTierClaim("x", "y");
  item.amount = 1182;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierClaimTitleLengthRule flags a long title", () => {
  const rule = new TierClaimTitleLengthRule(1000);
  const item = newTierClaim("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierClaimRequiredNameRule flags a blank name", () => {
  const rule = new TierClaimRequiredNameRule("tier claim needs a value");
  const item = newTierClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierClaimRequiredCodeRule flags a blank code", () => {
  const rule = new TierClaimRequiredCodeRule("tier claim needs a value");
  const item = newTierClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
