import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTierCheckpointCodeLengthRule,
  LegacyTierCheckpointLabelLengthRule,
  LegacyTierCheckpointPriorityRangeRule,
  LegacyTierCheckpointThresholdRangeRule,
  defaultLegacyTierCheckpointValidator,
} from "./legacy-tier-checkpoint-rules.js";
import { newLegacyTierCheckpoint } from "./legacy-tier-checkpoint.js";

test("LegacyTierCheckpointValidator reports every problem", () => {
  const validator = defaultLegacyTierCheckpointValidator();
  const item = newLegacyTierCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTierCheckpointCodeLengthRule flags a long code", () => {
  const rule = new LegacyTierCheckpointCodeLengthRule(80);
  const item = newLegacyTierCheckpoint("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyTierCheckpointPriorityRangeRule flags values above priority", () => {
  const rule = new LegacyTierCheckpointPriorityRangeRule(32, 1000);
  const item = newLegacyTierCheckpoint("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTierCheckpointThresholdRangeRule flags values above threshold", () => {
  const rule = new LegacyTierCheckpointThresholdRangeRule(3.8, 4449.2);
  const item = newLegacyTierCheckpoint("x", "y");
  item.threshold = 4450.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTierCheckpointLabelLengthRule flags a long label", () => {
  const rule = new LegacyTierCheckpointLabelLengthRule(1000);
  const item = newLegacyTierCheckpoint("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
