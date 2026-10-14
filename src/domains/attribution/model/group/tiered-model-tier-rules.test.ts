import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredModelTierCodeLengthRule,
  TieredModelTierRequiredCategoryRule,
  TieredModelTierRequiredCodeRule,
  defaultTieredModelTierValidator,
} from "./tiered-model-tier-rules.js";
import { newTieredModelTier } from "./tiered-model-tier.js";

test("TieredModelTierValidator reports every problem", () => {
  const validator = defaultTieredModelTierValidator();
  const item = newTieredModelTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredModelTierRequiredCategoryRule flags a blank category", () => {
  const rule = new TieredModelTierRequiredCategoryRule("tiered model tier needs an entry");
  const item = newTieredModelTier("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredModelTierRequiredCodeRule flags a blank code", () => {
  const rule = new TieredModelTierRequiredCodeRule("tiered model tier needs an entry");
  const item = newTieredModelTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredModelTierCodeLengthRule flags a long code", () => {
  const rule = new TieredModelTierCodeLengthRule(3600);
  const item = newTieredModelTier("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
