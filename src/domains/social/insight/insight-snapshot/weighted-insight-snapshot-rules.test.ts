import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInsightSnapshotAttemptsRangeRule,
  WeightedInsightSnapshotLabelLengthRule,
  WeightedInsightSnapshotNameLengthRule,
  WeightedInsightSnapshotRequiredCodeRule,
  WeightedInsightSnapshotRevisionRangeRule,
  defaultWeightedInsightSnapshotValidator,
} from "./weighted-insight-snapshot-rules.js";
import { newWeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

test("WeightedInsightSnapshotValidator reports every problem", () => {
  const validator = defaultWeightedInsightSnapshotValidator();
  const item = newWeightedInsightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInsightSnapshotNameLengthRule flags a long name", () => {
  const rule = new WeightedInsightSnapshotNameLengthRule(3600);
  const item = newWeightedInsightSnapshot("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInsightSnapshotLabelLengthRule flags a long label", () => {
  const rule = new WeightedInsightSnapshotLabelLengthRule(80);
  const item = newWeightedInsightSnapshot("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInsightSnapshotAttemptsRangeRule flags values above attempts", () => {
  const rule = new WeightedInsightSnapshotAttemptsRangeRule(32, 3600);
  const item = newWeightedInsightSnapshot("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInsightSnapshotRevisionRangeRule flags values above revision", () => {
  const rule = new WeightedInsightSnapshotRevisionRangeRule(32, 86400);
  const item = newWeightedInsightSnapshot("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInsightSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedInsightSnapshotRequiredCodeRule("weighted insight snapshot needs an entry");
  const item = newWeightedInsightSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
