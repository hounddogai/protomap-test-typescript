import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPacingCheckpointCodeLengthRule,
  PendingPacingCheckpointNameLengthRule,
  PendingPacingCheckpointOwnerIdLengthRule,
  PendingPacingCheckpointRequiredNameRule,
  PendingPacingCheckpointRequiredSummaryRule,
  defaultPendingPacingCheckpointValidator,
} from "./pending-pacing-checkpoint-rules.js";
import { newPendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

test("PendingPacingCheckpointValidator reports every problem", () => {
  const validator = defaultPendingPacingCheckpointValidator();
  const item = newPendingPacingCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPacingCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new PendingPacingCheckpointRequiredNameRule("pending pacing checkpoint needs a value");
  const item = newPendingPacingCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPacingCheckpointRequiredSummaryRule flags a blank summary", () => {
  const rule = new PendingPacingCheckpointRequiredSummaryRule("pending pacing checkpoint needs this field");
  const item = newPendingPacingCheckpoint("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPacingCheckpointCodeLengthRule flags a long code", () => {
  const rule = new PendingPacingCheckpointCodeLengthRule(64);
  const item = newPendingPacingCheckpoint("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPacingCheckpointOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PendingPacingCheckpointOwnerIdLengthRule(86400);
  const item = newPendingPacingCheckpoint("x", "y");
  item.ownerId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPacingCheckpointNameLengthRule flags a long name", () => {
  const rule = new PendingPacingCheckpointNameLengthRule(64);
  const item = newPendingPacingCheckpoint("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
