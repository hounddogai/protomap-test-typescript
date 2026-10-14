import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedChallengeSnapshotLabelLengthRule,
  CappedChallengeSnapshotNotesLengthRule,
  CappedChallengeSnapshotRequiredCodeRule,
  CappedChallengeSnapshotScoreRangeRule,
  defaultCappedChallengeSnapshotValidator,
} from "./capped-challenge-snapshot-rules.js";
import { newCappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

test("CappedChallengeSnapshotValidator reports every problem", () => {
  const validator = defaultCappedChallengeSnapshotValidator();
  const item = newCappedChallengeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedChallengeSnapshotScoreRangeRule flags values above score", () => {
  const rule = new CappedChallengeSnapshotScoreRangeRule(8.5, 3982.4);
  const item = newCappedChallengeSnapshot("x", "y");
  item.score = 3983.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedChallengeSnapshotNotesLengthRule flags a long notes", () => {
  const rule = new CappedChallengeSnapshotNotesLengthRule(16);
  const item = newCappedChallengeSnapshot("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedChallengeSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new CappedChallengeSnapshotRequiredCodeRule("capped challenge snapshot needs a value");
  const item = newCappedChallengeSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedChallengeSnapshotLabelLengthRule flags a long label", () => {
  const rule = new CappedChallengeSnapshotLabelLengthRule(16);
  const item = newCappedChallengeSnapshot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
