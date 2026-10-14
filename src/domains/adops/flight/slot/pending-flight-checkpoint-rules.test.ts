import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFlightCheckpointEndsAtRangeRule,
  PendingFlightCheckpointRequiredTitleRule,
  defaultPendingFlightCheckpointValidator,
} from "./pending-flight-checkpoint-rules.js";
import { newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("PendingFlightCheckpointValidator reports every problem", () => {
  const validator = defaultPendingFlightCheckpointValidator();
  const item = newPendingFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFlightCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new PendingFlightCheckpointRequiredTitleRule("pending flight checkpoint needs this field");
  const item = newPendingFlightCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFlightCheckpointEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingFlightCheckpointEndsAtRangeRule(80, 3600);
  const item = newPendingFlightCheckpoint("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
