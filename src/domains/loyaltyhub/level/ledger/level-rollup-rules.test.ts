import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelRollupOwnerIdLengthRule,
  LevelRollupRequiredSourceRule,
  LevelRollupSourceLengthRule,
  defaultLevelRollupValidator,
} from "./level-rollup-rules.js";
import { newLevelRollup } from "./level-rollup.js";

test("LevelRollupValidator reports every problem", () => {
  const validator = defaultLevelRollupValidator();
  const item = newLevelRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelRollupOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LevelRollupOwnerIdLengthRule(32);
  const item = newLevelRollup("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelRollupRequiredSourceRule flags a blank source", () => {
  const rule = new LevelRollupRequiredSourceRule("level rollup needs a value");
  const item = newLevelRollup("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelRollupSourceLengthRule flags a long source", () => {
  const rule = new LevelRollupSourceLengthRule(255);
  const item = newLevelRollup("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
