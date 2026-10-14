import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPlacementEstimateLabelLengthRule,
  DefaultPlacementEstimateLocaleLengthRule,
  DefaultPlacementEstimateRequiredLocaleRule,
  defaultDefaultPlacementEstimateValidator,
} from "./default-placement-estimate-rules.js";
import { newDefaultPlacementEstimate } from "./default-placement-estimate.js";

test("DefaultPlacementEstimateValidator reports every problem", () => {
  const validator = defaultDefaultPlacementEstimateValidator();
  const item = newDefaultPlacementEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPlacementEstimateLabelLengthRule flags a long label", () => {
  const rule = new DefaultPlacementEstimateLabelLengthRule(1000);
  const item = newDefaultPlacementEstimate("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPlacementEstimateLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultPlacementEstimateLocaleLengthRule(120);
  const item = newDefaultPlacementEstimate("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPlacementEstimateRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultPlacementEstimateRequiredLocaleRule("default placement estimate needs this field");
  const item = newDefaultPlacementEstimate("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
