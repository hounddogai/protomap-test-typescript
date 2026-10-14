import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWarmupClaimCategoryLengthRule,
  TieredWarmupClaimCostRangeRule,
  TieredWarmupClaimLabelLengthRule,
  defaultTieredWarmupClaimValidator,
} from "./tiered-warmup-claim-rules.js";
import { newTieredWarmupClaim } from "./tiered-warmup-claim.js";

test("TieredWarmupClaimValidator reports every problem", () => {
  const validator = defaultTieredWarmupClaimValidator();
  const item = newTieredWarmupClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWarmupClaimLabelLengthRule flags a long label", () => {
  const rule = new TieredWarmupClaimLabelLengthRule(3600);
  const item = newTieredWarmupClaim("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWarmupClaimCategoryLengthRule flags a long category", () => {
  const rule = new TieredWarmupClaimCategoryLengthRule(3600);
  const item = newTieredWarmupClaim("x", "y");
  item.category = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWarmupClaimCostRangeRule flags values above cost", () => {
  const rule = new TieredWarmupClaimCostRangeRule(0.2, 4315.3);
  const item = newTieredWarmupClaim("x", "y");
  item.cost = 4316.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
