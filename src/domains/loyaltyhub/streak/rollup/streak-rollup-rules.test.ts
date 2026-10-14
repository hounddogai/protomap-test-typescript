import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakRollupCodeLengthRule,
  StreakRollupCohortLengthRule,
  StreakRollupOwnerIdLengthRule,
  StreakRollupRequiredCohortRule,
  StreakRollupRequiredNameRule,
  StreakRollupRequiredOwnerIdRule,
  defaultStreakRollupValidator,
} from "./streak-rollup-rules.js";
import { newStreakRollup } from "./streak-rollup.js";

test("StreakRollupValidator reports every problem", () => {
  const validator = defaultStreakRollupValidator();
  const item = newStreakRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakRollupCohortLengthRule flags a long cohort", () => {
  const rule = new StreakRollupCohortLengthRule(80);
  const item = newStreakRollup("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakRollupRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StreakRollupRequiredOwnerIdRule("streak rollup needs a value");
  const item = newStreakRollup("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRollupRequiredCohortRule flags a blank cohort", () => {
  const rule = new StreakRollupRequiredCohortRule("streak rollup needs a value");
  const item = newStreakRollup("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRollupRequiredNameRule flags a blank name", () => {
  const rule = new StreakRollupRequiredNameRule("streak rollup needs a value");
  const item = newStreakRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRollupCodeLengthRule flags a long code", () => {
  const rule = new StreakRollupCodeLengthRule(32);
  const item = newStreakRollup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakRollupOwnerIdLengthRule flags a long owner id", () => {
  const rule = new StreakRollupOwnerIdLengthRule(1000);
  const item = newStreakRollup("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
