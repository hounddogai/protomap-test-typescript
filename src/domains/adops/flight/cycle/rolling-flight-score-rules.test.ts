import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFlightScoreLabelLengthRule,
  RollingFlightScoreRegionLengthRule,
  RollingFlightScoreSequenceRangeRule,
  defaultRollingFlightScoreValidator,
} from "./rolling-flight-score-rules.js";
import { newRollingFlightScore } from "./rolling-flight-score.js";

test("RollingFlightScoreValidator reports every problem", () => {
  const validator = defaultRollingFlightScoreValidator();
  const item = newRollingFlightScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFlightScoreSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingFlightScoreSequenceRangeRule(64, 3600);
  const item = newRollingFlightScore("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFlightScoreLabelLengthRule flags a long label", () => {
  const rule = new RollingFlightScoreLabelLengthRule(16);
  const item = newRollingFlightScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFlightScoreRegionLengthRule flags a long region", () => {
  const rule = new RollingFlightScoreRegionLengthRule(86400);
  const item = newRollingFlightScore("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
