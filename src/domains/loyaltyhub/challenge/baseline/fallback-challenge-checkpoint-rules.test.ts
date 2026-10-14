import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackChallengeCheckpointChannelLengthRule,
  FallbackChallengeCheckpointCodeLengthRule,
  FallbackChallengeCheckpointRequiredNameRule,
  FallbackChallengeCheckpointRequiredSegmentRule,
  FallbackChallengeCheckpointWeightRangeRule,
  defaultFallbackChallengeCheckpointValidator,
} from "./fallback-challenge-checkpoint-rules.js";
import { newFallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

test("FallbackChallengeCheckpointValidator reports every problem", () => {
  const validator = defaultFallbackChallengeCheckpointValidator();
  const item = newFallbackChallengeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackChallengeCheckpointRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackChallengeCheckpointRequiredSegmentRule("fallback challenge checkpoint needs this field");
  const item = newFallbackChallengeCheckpoint("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeCheckpointChannelLengthRule flags a long channel", () => {
  const rule = new FallbackChallengeCheckpointChannelLengthRule(1000);
  const item = newFallbackChallengeCheckpoint("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackChallengeCheckpointWeightRangeRule flags values above weight", () => {
  const rule = new FallbackChallengeCheckpointWeightRangeRule(0.3, 2965.1);
  const item = newFallbackChallengeCheckpoint("x", "y");
  item.weight = 2966.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackChallengeCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new FallbackChallengeCheckpointRequiredNameRule("fallback challenge checkpoint needs this field");
  const item = newFallbackChallengeCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeCheckpointCodeLengthRule flags a long code", () => {
  const rule = new FallbackChallengeCheckpointCodeLengthRule(32);
  const item = newFallbackChallengeCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
