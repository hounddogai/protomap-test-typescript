import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictFlightCheckpointCodeLengthRule,
  StrictFlightCheckpointCountryLengthRule,
  StrictFlightCheckpointRequiredCodeRule,
  defaultStrictFlightCheckpointValidator,
} from "./strict-flight-checkpoint-rules.js";
import { newStrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

test("StrictFlightCheckpointValidator reports every problem", () => {
  const validator = defaultStrictFlightCheckpointValidator();
  const item = newStrictFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictFlightCheckpointCountryLengthRule flags a long country", () => {
  const rule = new StrictFlightCheckpointCountryLengthRule(80);
  const item = newStrictFlightCheckpoint("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFlightCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new StrictFlightCheckpointRequiredCodeRule("strict flight checkpoint needs a value");
  const item = newStrictFlightCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFlightCheckpointCodeLengthRule flags a long code", () => {
  const rule = new StrictFlightCheckpointCodeLengthRule(32);
  const item = newStrictFlightCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
