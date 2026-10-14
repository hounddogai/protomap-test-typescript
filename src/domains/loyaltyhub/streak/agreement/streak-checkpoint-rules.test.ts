import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakCheckpointCodeLengthRule,
  StreakCheckpointRequiredAudienceIdRule,
  StreakCheckpointVariantLengthRule,
  defaultStreakCheckpointValidator,
} from "./streak-checkpoint-rules.js";
import { newStreakCheckpoint } from "./streak-checkpoint.js";

test("StreakCheckpointValidator reports every problem", () => {
  const validator = defaultStreakCheckpointValidator();
  const item = newStreakCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakCheckpointVariantLengthRule flags a long variant", () => {
  const rule = new StreakCheckpointVariantLengthRule(86400);
  const item = newStreakCheckpoint("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakCheckpointCodeLengthRule flags a long code", () => {
  const rule = new StreakCheckpointCodeLengthRule(3600);
  const item = newStreakCheckpoint("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakCheckpointRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new StreakCheckpointRequiredAudienceIdRule("streak checkpoint needs a value");
  const item = newStreakCheckpoint("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
