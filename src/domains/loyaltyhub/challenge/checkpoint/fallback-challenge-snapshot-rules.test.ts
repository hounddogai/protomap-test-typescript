import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackChallengeSnapshotCodeLengthRule,
  FallbackChallengeSnapshotRequiredOwnerIdRule,
  FallbackChallengeSnapshotRequiredVariantRule,
  FallbackChallengeSnapshotScoreRangeRule,
  defaultFallbackChallengeSnapshotValidator,
} from "./fallback-challenge-snapshot-rules.js";
import { newFallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

test("FallbackChallengeSnapshotValidator reports every problem", () => {
  const validator = defaultFallbackChallengeSnapshotValidator();
  const item = newFallbackChallengeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackChallengeSnapshotCodeLengthRule flags a long code", () => {
  const rule = new FallbackChallengeSnapshotCodeLengthRule(3600);
  const item = newFallbackChallengeSnapshot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackChallengeSnapshotScoreRangeRule flags values above score", () => {
  const rule = new FallbackChallengeSnapshotScoreRangeRule(3.5, 4827.9);
  const item = newFallbackChallengeSnapshot("x", "y");
  item.score = 4829.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackChallengeSnapshotRequiredVariantRule flags a blank variant", () => {
  const rule = new FallbackChallengeSnapshotRequiredVariantRule("fallback challenge snapshot needs an entry");
  const item = newFallbackChallengeSnapshot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeSnapshotRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackChallengeSnapshotRequiredOwnerIdRule("fallback challenge snapshot needs this field");
  const item = newFallbackChallengeSnapshot("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
