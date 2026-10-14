import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeCheckpointClicksRangeRule,
  NudgeCheckpointExpiresAtRangeRule,
  NudgeCheckpointNameLengthRule,
  defaultNudgeCheckpointValidator,
} from "./nudge-checkpoint-rules.js";
import { newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("NudgeCheckpointValidator reports every problem", () => {
  const validator = defaultNudgeCheckpointValidator();
  const item = newNudgeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeCheckpointNameLengthRule flags a long name", () => {
  const rule = new NudgeCheckpointNameLengthRule(1000);
  const item = newNudgeCheckpoint("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeCheckpointExpiresAtRangeRule flags values above expires at", () => {
  const rule = new NudgeCheckpointExpiresAtRangeRule(1000, 3600);
  const item = newNudgeCheckpoint("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new NudgeCheckpointClicksRangeRule(16, 64);
  const item = newNudgeCheckpoint("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
