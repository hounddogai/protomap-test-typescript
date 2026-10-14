import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationClaimAmountRangeRule,
  ActivationClaimCategoryLengthRule,
  ActivationClaimUnitLengthRule,
  ActivationClaimWeightRangeRule,
  defaultActivationClaimValidator,
} from "./activation-claim-rules.js";
import { newActivationClaim } from "./activation-claim.js";

test("ActivationClaimValidator reports every problem", () => {
  const validator = defaultActivationClaimValidator();
  const item = newActivationClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationClaimCategoryLengthRule flags a long category", () => {
  const rule = new ActivationClaimCategoryLengthRule(1000);
  const item = newActivationClaim("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationClaimWeightRangeRule flags values above weight", () => {
  const rule = new ActivationClaimWeightRangeRule(9.2, 2216.9);
  const item = newActivationClaim("x", "y");
  item.weight = 2218.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationClaimUnitLengthRule flags a long unit", () => {
  const rule = new ActivationClaimUnitLengthRule(16);
  const item = newActivationClaim("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationClaimAmountRangeRule flags values above amount", () => {
  const rule = new ActivationClaimAmountRangeRule(7.8, 814);
  const item = newActivationClaim("x", "y");
  item.amount = 815.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
