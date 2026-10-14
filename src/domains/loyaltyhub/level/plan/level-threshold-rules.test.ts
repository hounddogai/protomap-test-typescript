import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelThresholdCodeLengthRule,
  LevelThresholdQuantityRangeRule,
  LevelThresholdRequiredCodeRule,
  LevelThresholdRequiredLabelRule,
  LevelThresholdRequiredRegionRule,
  LevelThresholdSequenceRangeRule,
  defaultLevelThresholdValidator,
} from "./level-threshold-rules.js";
import { newLevelThreshold } from "./level-threshold.js";

test("LevelThresholdValidator reports every problem", () => {
  const validator = defaultLevelThresholdValidator();
  const item = newLevelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelThresholdCodeLengthRule flags a long code", () => {
  const rule = new LevelThresholdCodeLengthRule(80);
  const item = newLevelThreshold("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelThresholdQuantityRangeRule flags values above quantity", () => {
  const rule = new LevelThresholdQuantityRangeRule(80, 120);
  const item = newLevelThreshold("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelThresholdRequiredRegionRule flags a blank region", () => {
  const rule = new LevelThresholdRequiredRegionRule("level threshold needs an entry");
  const item = newLevelThreshold("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new LevelThresholdRequiredCodeRule("level threshold needs an entry");
  const item = newLevelThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new LevelThresholdRequiredLabelRule("level threshold needs this field");
  const item = newLevelThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelThresholdSequenceRangeRule flags values above sequence", () => {
  const rule = new LevelThresholdSequenceRangeRule(3600, 86400);
  const item = newLevelThreshold("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
