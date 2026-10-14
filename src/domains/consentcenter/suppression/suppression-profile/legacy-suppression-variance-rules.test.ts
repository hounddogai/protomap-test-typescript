import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySuppressionVarianceRequiredCodeRule,
  LegacySuppressionVarianceRequiredSegmentRule,
  LegacySuppressionVarianceTitleLengthRule,
  defaultLegacySuppressionVarianceValidator,
} from "./legacy-suppression-variance-rules.js";
import { newLegacySuppressionVariance } from "./legacy-suppression-variance.js";

test("LegacySuppressionVarianceValidator reports every problem", () => {
  const validator = defaultLegacySuppressionVarianceValidator();
  const item = newLegacySuppressionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySuppressionVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySuppressionVarianceRequiredCodeRule("legacy suppression variance needs a value");
  const item = newLegacySuppressionVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySuppressionVarianceTitleLengthRule flags a long title", () => {
  const rule = new LegacySuppressionVarianceTitleLengthRule(1000);
  const item = newLegacySuppressionVariance("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySuppressionVarianceRequiredSegmentRule flags a blank segment", () => {
  const rule = new LegacySuppressionVarianceRequiredSegmentRule("legacy suppression variance needs an entry");
  const item = newLegacySuppressionVariance("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
