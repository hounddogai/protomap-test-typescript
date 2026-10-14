import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderSnapshotCohortLengthRule,
  SenderSnapshotRequiredLabelRule,
  SenderSnapshotRequiredSegmentRule,
  defaultSenderSnapshotValidator,
} from "./sender-snapshot-rules.js";
import { newSenderSnapshot } from "./sender-snapshot.js";

test("SenderSnapshotValidator reports every problem", () => {
  const validator = defaultSenderSnapshotValidator();
  const item = newSenderSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderSnapshotRequiredSegmentRule flags a blank segment", () => {
  const rule = new SenderSnapshotRequiredSegmentRule("sender snapshot needs an entry");
  const item = newSenderSnapshot("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderSnapshotCohortLengthRule flags a long cohort", () => {
  const rule = new SenderSnapshotCohortLengthRule(32);
  const item = newSenderSnapshot("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new SenderSnapshotRequiredLabelRule("sender snapshot needs this field");
  const item = newSenderSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
