import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEscalationCheckpointCodeLengthRule,
  WeightedEscalationCheckpointNameLengthRule,
  WeightedEscalationCheckpointRequiredLocaleRule,
  WeightedEscalationCheckpointScoreRangeRule,
  defaultWeightedEscalationCheckpointValidator,
} from "./weighted-escalation-checkpoint-rules.js";
import { newWeightedEscalationCheckpoint } from "./weighted-escalation-checkpoint.js";

test("WeightedEscalationCheckpointValidator reports every problem", () => {
  const validator = defaultWeightedEscalationCheckpointValidator();
  const item = newWeightedEscalationCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEscalationCheckpointCodeLengthRule flags a long code", () => {
  const rule = new WeightedEscalationCheckpointCodeLengthRule(32);
  const item = newWeightedEscalationCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEscalationCheckpointNameLengthRule flags a long name", () => {
  const rule = new WeightedEscalationCheckpointNameLengthRule(255);
  const item = newWeightedEscalationCheckpoint("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEscalationCheckpointScoreRangeRule flags values above score", () => {
  const rule = new WeightedEscalationCheckpointScoreRangeRule(3.1, 4674.2);
  const item = newWeightedEscalationCheckpoint("x", "y");
  item.score = 4675.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEscalationCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedEscalationCheckpointRequiredLocaleRule("weighted escalation checkpoint needs this field");
  const item = newWeightedEscalationCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
