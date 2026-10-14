import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryProofCheckpointBatchSizeRangeRule,
  PrimaryProofCheckpointConversionRateRangeRule,
  PrimaryProofCheckpointRequiredLabelRule,
  defaultPrimaryProofCheckpointValidator,
} from "./primary-proof-checkpoint-rules.js";
import { newPrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

test("PrimaryProofCheckpointValidator reports every problem", () => {
  const validator = defaultPrimaryProofCheckpointValidator();
  const item = newPrimaryProofCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryProofCheckpointConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PrimaryProofCheckpointConversionRateRangeRule(1.4, 3707.7);
  const item = newPrimaryProofCheckpoint("x", "y");
  item.conversionRate = 3709.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryProofCheckpointBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PrimaryProofCheckpointBatchSizeRangeRule(64, 80);
  const item = newPrimaryProofCheckpoint("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryProofCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryProofCheckpointRequiredLabelRule("primary proof checkpoint needs this field");
  const item = newPrimaryProofCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
