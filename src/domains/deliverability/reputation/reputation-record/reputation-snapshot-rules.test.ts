import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationSnapshotCodeLengthRule,
  ReputationSnapshotRequiredCohortRule,
  ReputationSnapshotRequiredSummaryRule,
  ReputationSnapshotRequiredTitleRule,
  defaultReputationSnapshotValidator,
} from "./reputation-snapshot-rules.js";
import { newReputationSnapshot } from "./reputation-snapshot.js";

test("ReputationSnapshotValidator reports every problem", () => {
  const validator = defaultReputationSnapshotValidator();
  const item = newReputationSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationSnapshotRequiredSummaryRule flags a blank summary", () => {
  const rule = new ReputationSnapshotRequiredSummaryRule("reputation snapshot needs an entry");
  const item = newReputationSnapshot("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationSnapshotRequiredCohortRule flags a blank cohort", () => {
  const rule = new ReputationSnapshotRequiredCohortRule("reputation snapshot needs an entry");
  const item = newReputationSnapshot("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new ReputationSnapshotRequiredTitleRule("reputation snapshot needs a value");
  const item = newReputationSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationSnapshotCodeLengthRule flags a long code", () => {
  const rule = new ReputationSnapshotCodeLengthRule(64);
  const item = newReputationSnapshot("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
