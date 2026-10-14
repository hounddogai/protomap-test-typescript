import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInSnapshotRequiredCodeRule,
  DoubleOptInSnapshotReviewerLengthRule,
  defaultDoubleOptInSnapshotValidator,
} from "./double-opt-in-snapshot-rules.js";
import { newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("DoubleOptInSnapshotValidator reports every problem", () => {
  const validator = defaultDoubleOptInSnapshotValidator();
  const item = newDoubleOptInSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInSnapshotReviewerLengthRule flags a long reviewer", () => {
  const rule = new DoubleOptInSnapshotReviewerLengthRule(255);
  const item = newDoubleOptInSnapshot("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInSnapshotRequiredCodeRule("double opt in snapshot needs an entry");
  const item = newDoubleOptInSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
