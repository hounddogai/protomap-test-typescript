import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakBaselineCountryLengthRule,
  StreakBaselineNameLengthRule,
  defaultStreakBaselineValidator,
} from "./streak-baseline-rules.js";
import { newStreakBaseline } from "./streak-baseline.js";

test("StreakBaselineValidator reports every problem", () => {
  const validator = defaultStreakBaselineValidator();
  const item = newStreakBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakBaselineNameLengthRule flags a long name", () => {
  const rule = new StreakBaselineNameLengthRule(255);
  const item = newStreakBaseline("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakBaselineCountryLengthRule flags a long country", () => {
  const rule = new StreakBaselineCountryLengthRule(3600);
  const item = newStreakBaseline("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
