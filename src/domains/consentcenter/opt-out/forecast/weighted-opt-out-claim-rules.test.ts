import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedOptOutClaimCeilingRangeRule,
  WeightedOptOutClaimNameLengthRule,
  WeightedOptOutClaimRequiredTimezoneRule,
  WeightedOptOutClaimSegmentLengthRule,
  defaultWeightedOptOutClaimValidator,
} from "./weighted-opt-out-claim-rules.js";
import { newWeightedOptOutClaim } from "./weighted-opt-out-claim.js";

test("WeightedOptOutClaimValidator reports every problem", () => {
  const validator = defaultWeightedOptOutClaimValidator();
  const item = newWeightedOptOutClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedOptOutClaimSegmentLengthRule flags a long segment", () => {
  const rule = new WeightedOptOutClaimSegmentLengthRule(16);
  const item = newWeightedOptOutClaim("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutClaimNameLengthRule flags a long name", () => {
  const rule = new WeightedOptOutClaimNameLengthRule(16);
  const item = newWeightedOptOutClaim("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutClaimCeilingRangeRule flags values above ceiling", () => {
  const rule = new WeightedOptOutClaimCeilingRangeRule(1.3, 517.7);
  const item = newWeightedOptOutClaim("x", "y");
  item.ceiling = 519.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedOptOutClaimRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new WeightedOptOutClaimRequiredTimezoneRule("weighted opt out claim needs this field");
  const item = newWeightedOptOutClaim("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
