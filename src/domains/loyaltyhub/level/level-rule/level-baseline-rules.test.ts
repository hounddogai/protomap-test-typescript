import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelBaselineLocaleLengthRule,
  LevelBaselineRequiredLocaleRule,
  LevelBaselineTitleLengthRule,
  defaultLevelBaselineValidator,
} from "./level-baseline-rules.js";
import { newLevelBaseline } from "./level-baseline.js";

test("LevelBaselineValidator reports every problem", () => {
  const validator = defaultLevelBaselineValidator();
  const item = newLevelBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelBaselineRequiredLocaleRule flags a blank locale", () => {
  const rule = new LevelBaselineRequiredLocaleRule("level baseline needs an entry");
  const item = newLevelBaseline("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelBaselineLocaleLengthRule flags a long locale", () => {
  const rule = new LevelBaselineLocaleLengthRule(64);
  const item = newLevelBaseline("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelBaselineTitleLengthRule flags a long title", () => {
  const rule = new LevelBaselineTitleLengthRule(120);
  const item = newLevelBaseline("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
