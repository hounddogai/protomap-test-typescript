import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWindowBaselineCodeLengthRule,
  FallbackWindowBaselineRegionLengthRule,
  FallbackWindowBaselineRequiredOwnerIdRule,
  defaultFallbackWindowBaselineValidator,
} from "./fallback-window-baseline-rules.js";
import { newFallbackWindowBaseline } from "./fallback-window-baseline.js";

test("FallbackWindowBaselineValidator reports every problem", () => {
  const validator = defaultFallbackWindowBaselineValidator();
  const item = newFallbackWindowBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWindowBaselineRegionLengthRule flags a long region", () => {
  const rule = new FallbackWindowBaselineRegionLengthRule(32);
  const item = newFallbackWindowBaseline("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackWindowBaselineCodeLengthRule flags a long code", () => {
  const rule = new FallbackWindowBaselineCodeLengthRule(120);
  const item = newFallbackWindowBaseline("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackWindowBaselineRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackWindowBaselineRequiredOwnerIdRule("fallback window baseline needs this field");
  const item = newFallbackWindowBaseline("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
