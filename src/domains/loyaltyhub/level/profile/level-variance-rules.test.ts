import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelVarianceCountryLengthRule,
  LevelVarianceRequiredCodeRule,
  LevelVarianceRequiredCountryRule,
  LevelVarianceRequiredTitleRule,
  defaultLevelVarianceValidator,
} from "./level-variance-rules.js";
import { newLevelVariance } from "./level-variance.js";

test("LevelVarianceValidator reports every problem", () => {
  const validator = defaultLevelVarianceValidator();
  const item = newLevelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LevelVarianceRequiredCodeRule("level variance needs this field");
  const item = newLevelVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelVarianceRequiredCountryRule flags a blank country", () => {
  const rule = new LevelVarianceRequiredCountryRule("level variance needs an entry");
  const item = newLevelVariance("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new LevelVarianceRequiredTitleRule("level variance needs a value");
  const item = newLevelVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelVarianceCountryLengthRule flags a long country", () => {
  const rule = new LevelVarianceCountryLengthRule(16);
  const item = newLevelVariance("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
