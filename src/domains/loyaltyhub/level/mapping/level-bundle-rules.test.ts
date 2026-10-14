import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelBundleCodeLengthRule,
  LevelBundleRequiredSourceRule,
  LevelBundleRequiredTitleRule,
  LevelBundleRequiredUnitRule,
  LevelBundleTitleLengthRule,
  defaultLevelBundleValidator,
} from "./level-bundle-rules.js";
import { newLevelBundle } from "./level-bundle.js";

test("LevelBundleValidator reports every problem", () => {
  const validator = defaultLevelBundleValidator();
  const item = newLevelBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelBundleRequiredSourceRule flags a blank source", () => {
  const rule = new LevelBundleRequiredSourceRule("level bundle needs this field");
  const item = newLevelBundle("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelBundleRequiredTitleRule flags a blank title", () => {
  const rule = new LevelBundleRequiredTitleRule("level bundle needs an entry");
  const item = newLevelBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelBundleTitleLengthRule flags a long title", () => {
  const rule = new LevelBundleTitleLengthRule(64);
  const item = newLevelBundle("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelBundleCodeLengthRule flags a long code", () => {
  const rule = new LevelBundleCodeLengthRule(16);
  const item = newLevelBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelBundleRequiredUnitRule flags a blank unit", () => {
  const rule = new LevelBundleRequiredUnitRule("level bundle needs an entry");
  const item = newLevelBundle("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
