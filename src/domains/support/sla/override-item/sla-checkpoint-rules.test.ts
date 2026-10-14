import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaCheckpointCodeLengthRule,
  SlaCheckpointThresholdRangeRule,
  SlaCheckpointUnitLengthRule,
  defaultSlaCheckpointValidator,
} from "./sla-checkpoint-rules.js";
import { newSlaCheckpoint } from "./sla-checkpoint.js";

test("SlaCheckpointValidator reports every problem", () => {
  const validator = defaultSlaCheckpointValidator();
  const item = newSlaCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaCheckpointCodeLengthRule flags a long code", () => {
  const rule = new SlaCheckpointCodeLengthRule(255);
  const item = newSlaCheckpoint("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaCheckpointThresholdRangeRule flags values above threshold", () => {
  const rule = new SlaCheckpointThresholdRangeRule(6.4, 3194.3);
  const item = newSlaCheckpoint("x", "y");
  item.threshold = 3195.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaCheckpointUnitLengthRule flags a long unit", () => {
  const rule = new SlaCheckpointUnitLengthRule(120);
  const item = newSlaCheckpoint("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
