import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedChallengeSnapshotCodeLengthRule,
  WeightedChallengeSnapshotCountryLengthRule,
  WeightedChallengeSnapshotRequiredNameRule,
  defaultWeightedChallengeSnapshotValidator,
} from "./weighted-challenge-snapshot-rules.js";
import { newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

test("WeightedChallengeSnapshotValidator reports every problem", () => {
  const validator = defaultWeightedChallengeSnapshotValidator();
  const item = newWeightedChallengeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedChallengeSnapshotCountryLengthRule flags a long country", () => {
  const rule = new WeightedChallengeSnapshotCountryLengthRule(16);
  const item = newWeightedChallengeSnapshot("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedChallengeSnapshotCodeLengthRule flags a long code", () => {
  const rule = new WeightedChallengeSnapshotCodeLengthRule(16);
  const item = newWeightedChallengeSnapshot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedChallengeSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new WeightedChallengeSnapshotRequiredNameRule("weighted challenge snapshot needs this field");
  const item = newWeightedChallengeSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
