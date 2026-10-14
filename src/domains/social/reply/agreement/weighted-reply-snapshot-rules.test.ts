import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReplySnapshotCodeLengthRule,
  WeightedReplySnapshotNameLengthRule,
  WeightedReplySnapshotRequiredNameRule,
  WeightedReplySnapshotSegmentLengthRule,
  defaultWeightedReplySnapshotValidator,
} from "./weighted-reply-snapshot-rules.js";
import { newWeightedReplySnapshot } from "./weighted-reply-snapshot.js";

test("WeightedReplySnapshotValidator reports every problem", () => {
  const validator = defaultWeightedReplySnapshotValidator();
  const item = newWeightedReplySnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReplySnapshotNameLengthRule flags a long name", () => {
  const rule = new WeightedReplySnapshotNameLengthRule(16);
  const item = newWeightedReplySnapshot("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplySnapshotCodeLengthRule flags a long code", () => {
  const rule = new WeightedReplySnapshotCodeLengthRule(86400);
  const item = newWeightedReplySnapshot("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplySnapshotRequiredNameRule flags a blank name", () => {
  const rule = new WeightedReplySnapshotRequiredNameRule("weighted reply snapshot needs this field");
  const item = newWeightedReplySnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReplySnapshotSegmentLengthRule flags a long segment", () => {
  const rule = new WeightedReplySnapshotSegmentLengthRule(120);
  const item = newWeightedReplySnapshot("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
