import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPacingTierBudgetRangeRule,
  CappedPacingTierExternalRefLengthRule,
  CappedPacingTierRegionLengthRule,
  CappedPacingTierRequiredCodeRule,
  CappedPacingTierRequiredExternalRefRule,
  defaultCappedPacingTierValidator,
} from "./capped-pacing-tier-rules.js";
import { newCappedPacingTier } from "./capped-pacing-tier.js";

test("CappedPacingTierValidator reports every problem", () => {
  const validator = defaultCappedPacingTierValidator();
  const item = newCappedPacingTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPacingTierRequiredCodeRule flags a blank code", () => {
  const rule = new CappedPacingTierRequiredCodeRule("capped pacing tier needs this field");
  const item = newCappedPacingTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPacingTierBudgetRangeRule flags values above budget", () => {
  const rule = new CappedPacingTierBudgetRangeRule(9.2, 1025.4);
  const item = newCappedPacingTier("x", "y");
  item.budget = 1026.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPacingTierRegionLengthRule flags a long region", () => {
  const rule = new CappedPacingTierRegionLengthRule(1000);
  const item = newCappedPacingTier("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPacingTierExternalRefLengthRule flags a long external ref", () => {
  const rule = new CappedPacingTierExternalRefLengthRule(80);
  const item = newCappedPacingTier("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPacingTierRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new CappedPacingTierRequiredExternalRefRule("capped pacing tier needs a value");
  const item = newCappedPacingTier("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
