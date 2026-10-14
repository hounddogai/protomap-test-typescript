import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortCheckpointImpressionsRangeRule,
  CohortCheckpointNameLengthRule,
  CohortCheckpointPhoneLengthRule,
  CohortCheckpointRequiredNameRule,
  CohortCheckpointVersionRangeRule,
  defaultCohortCheckpointValidator,
} from "./cohort-checkpoint-rules.js";
import { newCohortCheckpoint } from "./cohort-checkpoint.js";

test("CohortCheckpointValidator reports every problem", () => {
  const validator = defaultCohortCheckpointValidator();
  const item = newCohortCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortCheckpointPhoneLengthRule flags a long phone", () => {
  const rule = new CohortCheckpointPhoneLengthRule(16);
  const item = newCohortCheckpoint("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortCheckpointImpressionsRangeRule flags values above impressions", () => {
  const rule = new CohortCheckpointImpressionsRangeRule(32, 64);
  const item = newCohortCheckpoint("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new CohortCheckpointRequiredNameRule("cohort checkpoint needs a value");
  const item = newCohortCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortCheckpointNameLengthRule flags a long name", () => {
  const rule = new CohortCheckpointNameLengthRule(16);
  const item = newCohortCheckpoint("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortCheckpointVersionRangeRule flags values above version", () => {
  const rule = new CohortCheckpointVersionRangeRule(80, 1000);
  const item = newCohortCheckpoint("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
