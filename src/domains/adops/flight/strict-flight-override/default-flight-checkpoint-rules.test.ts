import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFlightCheckpointCodeLengthRule,
  DefaultFlightCheckpointMarginRangeRule,
  DefaultFlightCheckpointTitleLengthRule,
  defaultDefaultFlightCheckpointValidator,
} from "./default-flight-checkpoint-rules.js";
import { newDefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

test("DefaultFlightCheckpointValidator reports every problem", () => {
  const validator = defaultDefaultFlightCheckpointValidator();
  const item = newDefaultFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFlightCheckpointTitleLengthRule flags a long title", () => {
  const rule = new DefaultFlightCheckpointTitleLengthRule(1000);
  const item = newDefaultFlightCheckpoint("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightCheckpointCodeLengthRule flags a long code", () => {
  const rule = new DefaultFlightCheckpointCodeLengthRule(255);
  const item = newDefaultFlightCheckpoint("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightCheckpointMarginRangeRule flags values above margin", () => {
  const rule = new DefaultFlightCheckpointMarginRangeRule(0, 1763.3);
  const item = newDefaultFlightCheckpoint("x", "y");
  item.margin = 1764.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
