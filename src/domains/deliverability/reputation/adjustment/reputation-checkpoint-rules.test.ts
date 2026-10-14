import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationCheckpointRegionLengthRule,
  ReputationCheckpointRequiredCodeRule,
  ReputationCheckpointRequiredRegionRule,
  ReputationCheckpointTitleLengthRule,
  ReputationCheckpointWeightRangeRule,
  defaultReputationCheckpointValidator,
} from "./reputation-checkpoint-rules.js";
import { newReputationCheckpoint } from "./reputation-checkpoint.js";

test("ReputationCheckpointValidator reports every problem", () => {
  const validator = defaultReputationCheckpointValidator();
  const item = newReputationCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationCheckpointWeightRangeRule flags values above weight", () => {
  const rule = new ReputationCheckpointWeightRangeRule(5.9, 4394.2);
  const item = newReputationCheckpoint("x", "y");
  item.weight = 4395.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationCheckpointTitleLengthRule flags a long title", () => {
  const rule = new ReputationCheckpointTitleLengthRule(32);
  const item = newReputationCheckpoint("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationCheckpointRequiredRegionRule flags a blank region", () => {
  const rule = new ReputationCheckpointRequiredRegionRule("reputation checkpoint needs a value");
  const item = newReputationCheckpoint("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationCheckpointRequiredCodeRule("reputation checkpoint needs this field");
  const item = newReputationCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationCheckpointRegionLengthRule flags a long region", () => {
  const rule = new ReputationCheckpointRegionLengthRule(1000);
  const item = newReputationCheckpoint("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
