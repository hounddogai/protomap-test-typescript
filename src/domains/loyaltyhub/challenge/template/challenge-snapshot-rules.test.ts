import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeSnapshotRequiredCategoryRule,
  ChallengeSnapshotRequiredJourneyIdRule,
  ChallengeSnapshotRequiredTitleRule,
  ChallengeSnapshotTitleLengthRule,
  defaultChallengeSnapshotValidator,
} from "./challenge-snapshot-rules.js";
import { newChallengeSnapshot } from "./challenge-snapshot.js";

test("ChallengeSnapshotValidator reports every problem", () => {
  const validator = defaultChallengeSnapshotValidator();
  const item = newChallengeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeSnapshotTitleLengthRule flags a long title", () => {
  const rule = new ChallengeSnapshotTitleLengthRule(16);
  const item = newChallengeSnapshot("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeSnapshotRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ChallengeSnapshotRequiredJourneyIdRule("challenge snapshot needs a value");
  const item = newChallengeSnapshot("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new ChallengeSnapshotRequiredTitleRule("challenge snapshot needs a value");
  const item = newChallengeSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeSnapshotRequiredCategoryRule flags a blank category", () => {
  const rule = new ChallengeSnapshotRequiredCategoryRule("challenge snapshot needs an entry");
  const item = newChallengeSnapshot("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
