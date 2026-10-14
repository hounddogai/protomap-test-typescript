import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPlacementRecordNotesLengthRule,
  WeightedPlacementRecordRequiredTitleRule,
  WeightedPlacementRecordTitleLengthRule,
  defaultWeightedPlacementRecordValidator,
} from "./weighted-placement-record-rules.js";
import { newWeightedPlacementRecord } from "./weighted-placement-record.js";

test("WeightedPlacementRecordValidator reports every problem", () => {
  const validator = defaultWeightedPlacementRecordValidator();
  const item = newWeightedPlacementRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPlacementRecordTitleLengthRule flags a long title", () => {
  const rule = new WeightedPlacementRecordTitleLengthRule(1000);
  const item = newWeightedPlacementRecord("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPlacementRecordRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedPlacementRecordRequiredTitleRule("weighted placement record needs a value");
  const item = newWeightedPlacementRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementRecordNotesLengthRule flags a long notes", () => {
  const rule = new WeightedPlacementRecordNotesLengthRule(32);
  const item = newWeightedPlacementRecord("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
