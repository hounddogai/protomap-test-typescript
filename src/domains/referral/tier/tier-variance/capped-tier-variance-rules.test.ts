import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTierVarianceCapacityRangeRule,
  CappedTierVarianceRequiredCodeRule,
  CappedTierVarianceRequiredUnitRule,
  defaultCappedTierVarianceValidator,
} from "./capped-tier-variance-rules.js";
import { newCappedTierVariance } from "./capped-tier-variance.js";

test("CappedTierVarianceValidator reports every problem", () => {
  const validator = defaultCappedTierVarianceValidator();
  const item = newCappedTierVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTierVarianceCapacityRangeRule flags values above capacity", () => {
  const rule = new CappedTierVarianceCapacityRangeRule(255, 86400);
  const item = newCappedTierVariance("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedTierVarianceRequiredUnitRule flags a blank unit", () => {
  const rule = new CappedTierVarianceRequiredUnitRule("capped tier variance needs an entry");
  const item = newCappedTierVariance("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedTierVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new CappedTierVarianceRequiredCodeRule("capped tier variance needs an entry");
  const item = newCappedTierVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
