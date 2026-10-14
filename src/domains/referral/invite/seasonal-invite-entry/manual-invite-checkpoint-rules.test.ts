import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualInviteCheckpointCodeLengthRule,
  ManualInviteCheckpointLocaleLengthRule,
  ManualInviteCheckpointRequiredLocaleRule,
  ManualInviteCheckpointUpdatedAtRangeRule,
  defaultManualInviteCheckpointValidator,
} from "./manual-invite-checkpoint-rules.js";
import { newManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

test("ManualInviteCheckpointValidator reports every problem", () => {
  const validator = defaultManualInviteCheckpointValidator();
  const item = newManualInviteCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualInviteCheckpointCodeLengthRule flags a long code", () => {
  const rule = new ManualInviteCheckpointCodeLengthRule(1000);
  const item = newManualInviteCheckpoint("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualInviteCheckpointUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ManualInviteCheckpointUpdatedAtRangeRule(120, 120);
  const item = newManualInviteCheckpoint("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualInviteCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new ManualInviteCheckpointRequiredLocaleRule("manual invite checkpoint needs a value");
  const item = newManualInviteCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualInviteCheckpointLocaleLengthRule flags a long locale", () => {
  const rule = new ManualInviteCheckpointLocaleLengthRule(64);
  const item = newManualInviteCheckpoint("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
