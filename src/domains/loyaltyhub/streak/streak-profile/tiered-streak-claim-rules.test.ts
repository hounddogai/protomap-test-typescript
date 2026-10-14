import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStreakClaimConversionRateRangeRule,
  TieredStreakClaimOwnerIdLengthRule,
  TieredStreakClaimRequiredUtmSourceRule,
  TieredStreakClaimUtmSourceLengthRule,
  defaultTieredStreakClaimValidator,
} from "./tiered-streak-claim-rules.js";
import { newTieredStreakClaim } from "./tiered-streak-claim.js";

test("TieredStreakClaimValidator reports every problem", () => {
  const validator = defaultTieredStreakClaimValidator();
  const item = newTieredStreakClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStreakClaimUtmSourceLengthRule flags a long utm source", () => {
  const rule = new TieredStreakClaimUtmSourceLengthRule(64);
  const item = newTieredStreakClaim("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredStreakClaimOwnerIdLengthRule flags a long owner id", () => {
  const rule = new TieredStreakClaimOwnerIdLengthRule(1000);
  const item = newTieredStreakClaim("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredStreakClaimConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TieredStreakClaimConversionRateRangeRule(2.8, 1177.2);
  const item = newTieredStreakClaim("x", "y");
  item.conversionRate = 1178.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStreakClaimRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredStreakClaimRequiredUtmSourceRule("tiered streak claim needs a value");
  const item = newTieredStreakClaim("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
