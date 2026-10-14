import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredActivationCheckpointCountryLengthRule,
  TieredActivationCheckpointExpiresAtRangeRule,
  TieredActivationCheckpointNameLengthRule,
  TieredActivationCheckpointRequiredCodeRule,
  TieredActivationCheckpointRequiredNameRule,
  TieredActivationCheckpointSourceLengthRule,
  defaultTieredActivationCheckpointValidator,
} from "./tiered-activation-checkpoint-rules.js";
import { newTieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

test("TieredActivationCheckpointValidator reports every problem", () => {
  const validator = defaultTieredActivationCheckpointValidator();
  const item = newTieredActivationCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredActivationCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new TieredActivationCheckpointRequiredCodeRule("tiered activation checkpoint needs an entry");
  const item = newTieredActivationCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new TieredActivationCheckpointRequiredNameRule("tiered activation checkpoint needs this field");
  const item = newTieredActivationCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationCheckpointSourceLengthRule flags a long source", () => {
  const rule = new TieredActivationCheckpointSourceLengthRule(120);
  const item = newTieredActivationCheckpoint("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationCheckpointNameLengthRule flags a long name", () => {
  const rule = new TieredActivationCheckpointNameLengthRule(3600);
  const item = newTieredActivationCheckpoint("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationCheckpointCountryLengthRule flags a long country", () => {
  const rule = new TieredActivationCheckpointCountryLengthRule(3600);
  const item = newTieredActivationCheckpoint("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationCheckpointExpiresAtRangeRule flags values above expires at", () => {
  const rule = new TieredActivationCheckpointExpiresAtRangeRule(32, 64);
  const item = newTieredActivationCheckpoint("x", "y");
  item.expiresAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
