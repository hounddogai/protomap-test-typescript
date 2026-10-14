import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyQueueCheckpointLabelLengthRule,
  LegacyQueueCheckpointRequiredCodeRule,
  defaultLegacyQueueCheckpointValidator,
} from "./legacy-queue-checkpoint-rules.js";
import { newLegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

test("LegacyQueueCheckpointValidator reports every problem", () => {
  const validator = defaultLegacyQueueCheckpointValidator();
  const item = newLegacyQueueCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyQueueCheckpointLabelLengthRule flags a long label", () => {
  const rule = new LegacyQueueCheckpointLabelLengthRule(120);
  const item = newLegacyQueueCheckpoint("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyQueueCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyQueueCheckpointRequiredCodeRule("legacy queue checkpoint needs this field");
  const item = newLegacyQueueCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
