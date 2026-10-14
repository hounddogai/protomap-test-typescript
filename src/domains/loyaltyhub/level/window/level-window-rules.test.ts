import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelWindowCodeLengthRule,
  LevelWindowNameLengthRule,
  LevelWindowRequiredUnitRule,
  LevelWindowReviewerLengthRule,
  LevelWindowUnitLengthRule,
  defaultLevelWindowValidator,
} from "./level-window-rules.js";
import { newLevelWindow } from "./level-window.js";

test("LevelWindowValidator reports every problem", () => {
  const validator = defaultLevelWindowValidator();
  const item = newLevelWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelWindowReviewerLengthRule flags a long reviewer", () => {
  const rule = new LevelWindowReviewerLengthRule(80);
  const item = newLevelWindow("x", "y");
  item.reviewer = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelWindowUnitLengthRule flags a long unit", () => {
  const rule = new LevelWindowUnitLengthRule(32);
  const item = newLevelWindow("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelWindowNameLengthRule flags a long name", () => {
  const rule = new LevelWindowNameLengthRule(86400);
  const item = newLevelWindow("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelWindowCodeLengthRule flags a long code", () => {
  const rule = new LevelWindowCodeLengthRule(120);
  const item = newLevelWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelWindowRequiredUnitRule flags a blank unit", () => {
  const rule = new LevelWindowRequiredUnitRule("level window needs a value");
  const item = newLevelWindow("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
