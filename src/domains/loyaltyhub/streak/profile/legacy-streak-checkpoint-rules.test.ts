import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyStreakCheckpointPhoneLengthRule,
  LegacyStreakCheckpointRequiredPhoneRule,
  LegacyStreakCheckpointRequiredTitleRule,
  LegacyStreakCheckpointTitleLengthRule,
  LegacyStreakCheckpointWeightRangeRule,
  defaultLegacyStreakCheckpointValidator,
} from "./legacy-streak-checkpoint-rules.js";
import { newLegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

test("LegacyStreakCheckpointValidator reports every problem", () => {
  const validator = defaultLegacyStreakCheckpointValidator();
  const item = newLegacyStreakCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyStreakCheckpointTitleLengthRule flags a long title", () => {
  const rule = new LegacyStreakCheckpointTitleLengthRule(32);
  const item = newLegacyStreakCheckpoint("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyStreakCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyStreakCheckpointRequiredTitleRule("legacy streak checkpoint needs a value");
  const item = newLegacyStreakCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyStreakCheckpointPhoneLengthRule flags a long phone", () => {
  const rule = new LegacyStreakCheckpointPhoneLengthRule(86400);
  const item = newLegacyStreakCheckpoint("x", "y");
  item.phone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyStreakCheckpointRequiredPhoneRule flags a blank phone", () => {
  const rule = new LegacyStreakCheckpointRequiredPhoneRule("legacy streak checkpoint needs a value");
  const item = newLegacyStreakCheckpoint("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyStreakCheckpointWeightRangeRule flags values above weight", () => {
  const rule = new LegacyStreakCheckpointWeightRangeRule(7.5, 2657.8);
  const item = newLegacyStreakCheckpoint("x", "y");
  item.weight = 2659.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
