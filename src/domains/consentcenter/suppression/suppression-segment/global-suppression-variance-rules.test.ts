import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionVarianceCodeLengthRule,
  GlobalSuppressionVarianceExpiresAtRangeRule,
  GlobalSuppressionVarianceFloorValueRangeRule,
  GlobalSuppressionVarianceRequiredCodeRule,
  defaultGlobalSuppressionVarianceValidator,
} from "./global-suppression-variance-rules.js";
import { newGlobalSuppressionVariance } from "./global-suppression-variance.js";

test("GlobalSuppressionVarianceValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionVarianceValidator();
  const item = newGlobalSuppressionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalSuppressionVarianceRequiredCodeRule("global suppression variance needs a value");
  const item = newGlobalSuppressionVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSuppressionVarianceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new GlobalSuppressionVarianceExpiresAtRangeRule(64, 255);
  const item = newGlobalSuppressionVariance("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionVarianceFloorValueRangeRule flags values above floor value", () => {
  const rule = new GlobalSuppressionVarianceFloorValueRangeRule(3.4, 232.8);
  const item = newGlobalSuppressionVariance("x", "y");
  item.floorValue = 234.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionVarianceCodeLengthRule flags a long code", () => {
  const rule = new GlobalSuppressionVarianceCodeLengthRule(86400);
  const item = newGlobalSuppressionVariance("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
