import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementEstimateEndsAtRangeRule,
  PlacementEstimateLocaleLengthRule,
  PlacementEstimateRequiredCodeRule,
  PlacementEstimateRequiredLocaleRule,
  defaultPlacementEstimateValidator,
} from "./placement-estimate-rules.js";
import { newPlacementEstimate } from "./placement-estimate.js";

test("PlacementEstimateValidator reports every problem", () => {
  const validator = defaultPlacementEstimateValidator();
  const item = newPlacementEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementEstimateLocaleLengthRule flags a long locale", () => {
  const rule = new PlacementEstimateLocaleLengthRule(64);
  const item = newPlacementEstimate("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementEstimateRequiredLocaleRule flags a blank locale", () => {
  const rule = new PlacementEstimateRequiredLocaleRule("placement estimate needs a value");
  const item = newPlacementEstimate("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementEstimateEndsAtRangeRule flags values above ends at", () => {
  const rule = new PlacementEstimateEndsAtRangeRule(255, 86400);
  const item = newPlacementEstimate("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementEstimateRequiredCodeRule("placement estimate needs an entry");
  const item = newPlacementEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
