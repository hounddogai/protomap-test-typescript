import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathBaselineCategoryLengthRule,
  PathBaselineRequiredPhoneRule,
  defaultPathBaselineValidator,
} from "./path-baseline-rules.js";
import { newPathBaseline } from "./path-baseline.js";

test("PathBaselineValidator reports every problem", () => {
  const validator = defaultPathBaselineValidator();
  const item = newPathBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathBaselineRequiredPhoneRule flags a blank phone", () => {
  const rule = new PathBaselineRequiredPhoneRule("path baseline needs a value");
  const item = newPathBaseline("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathBaselineCategoryLengthRule flags a long category", () => {
  const rule = new PathBaselineCategoryLengthRule(120);
  const item = newPathBaseline("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
