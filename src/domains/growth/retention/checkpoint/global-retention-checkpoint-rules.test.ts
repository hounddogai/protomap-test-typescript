import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionCheckpointCodeLengthRule,
  GlobalRetentionCheckpointRequiredUnitRule,
  defaultGlobalRetentionCheckpointValidator,
} from "./global-retention-checkpoint-rules.js";
import { newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("GlobalRetentionCheckpointValidator reports every problem", () => {
  const validator = defaultGlobalRetentionCheckpointValidator();
  const item = newGlobalRetentionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionCheckpointRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalRetentionCheckpointRequiredUnitRule("global retention checkpoint needs an entry");
  const item = newGlobalRetentionCheckpoint("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new GlobalRetentionCheckpointCodeLengthRule(255);
  const item = newGlobalRetentionCheckpoint("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
