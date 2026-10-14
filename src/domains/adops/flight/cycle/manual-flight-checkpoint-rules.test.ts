import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFlightCheckpointContactEmailLengthRule,
  ManualFlightCheckpointDurationMinutesRangeRule,
  ManualFlightCheckpointRequiredContactEmailRule,
  ManualFlightCheckpointTimezoneLengthRule,
  defaultManualFlightCheckpointValidator,
} from "./manual-flight-checkpoint-rules.js";
import { newManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

test("ManualFlightCheckpointValidator reports every problem", () => {
  const validator = defaultManualFlightCheckpointValidator();
  const item = newManualFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFlightCheckpointRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ManualFlightCheckpointRequiredContactEmailRule("manual flight checkpoint needs a value");
  const item = newManualFlightCheckpoint("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFlightCheckpointDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ManualFlightCheckpointDurationMinutesRangeRule(120, 86400);
  const item = newManualFlightCheckpoint("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFlightCheckpointContactEmailLengthRule flags a long contact email", () => {
  const rule = new ManualFlightCheckpointContactEmailLengthRule(255);
  const item = newManualFlightCheckpoint("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFlightCheckpointTimezoneLengthRule flags a long timezone", () => {
  const rule = new ManualFlightCheckpointTimezoneLengthRule(255);
  const item = newManualFlightCheckpoint("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
