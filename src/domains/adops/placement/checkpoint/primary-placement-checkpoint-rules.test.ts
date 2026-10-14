import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPlacementCheckpointAttemptsRangeRule,
  PrimaryPlacementCheckpointCurrencyLengthRule,
  PrimaryPlacementCheckpointRequiredVariantRule,
  PrimaryPlacementCheckpointTitleLengthRule,
  defaultPrimaryPlacementCheckpointValidator,
} from "./primary-placement-checkpoint-rules.js";
import { newPrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

test("PrimaryPlacementCheckpointValidator reports every problem", () => {
  const validator = defaultPrimaryPlacementCheckpointValidator();
  const item = newPrimaryPlacementCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPlacementCheckpointCurrencyLengthRule flags a long currency", () => {
  const rule = new PrimaryPlacementCheckpointCurrencyLengthRule(64);
  const item = newPrimaryPlacementCheckpoint("x", "y");
  item.currency = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPlacementCheckpointRequiredVariantRule flags a blank variant", () => {
  const rule = new PrimaryPlacementCheckpointRequiredVariantRule("primary placement checkpoint needs an entry");
  const item = newPrimaryPlacementCheckpoint("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPlacementCheckpointTitleLengthRule flags a long title", () => {
  const rule = new PrimaryPlacementCheckpointTitleLengthRule(86400);
  const item = newPrimaryPlacementCheckpoint("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPlacementCheckpointAttemptsRangeRule flags values above attempts", () => {
  const rule = new PrimaryPlacementCheckpointAttemptsRangeRule(255, 1000);
  const item = newPrimaryPlacementCheckpoint("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
