import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWaitCheckpointBudgetRangeRule,
  LegacyWaitCheckpointCostRangeRule,
  LegacyWaitCheckpointLocaleLengthRule,
  LegacyWaitCheckpointRequiredCodeRule,
  LegacyWaitCheckpointRequiredLabelRule,
  defaultLegacyWaitCheckpointValidator,
} from "./legacy-wait-checkpoint-rules.js";
import { newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

test("LegacyWaitCheckpointValidator reports every problem", () => {
  const validator = defaultLegacyWaitCheckpointValidator();
  const item = newLegacyWaitCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWaitCheckpointBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyWaitCheckpointBudgetRangeRule(3.2, 3658.9);
  const item = newLegacyWaitCheckpoint("x", "y");
  item.budget = 3660.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitCheckpointLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyWaitCheckpointLocaleLengthRule(80);
  const item = newLegacyWaitCheckpoint("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWaitCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyWaitCheckpointRequiredCodeRule("legacy wait checkpoint needs this field");
  const item = newLegacyWaitCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWaitCheckpointCostRangeRule flags values above cost", () => {
  const rule = new LegacyWaitCheckpointCostRangeRule(1, 4351);
  const item = newLegacyWaitCheckpoint("x", "y");
  item.cost = 4352.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyWaitCheckpointRequiredLabelRule("legacy wait checkpoint needs an entry");
  const item = newLegacyWaitCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
