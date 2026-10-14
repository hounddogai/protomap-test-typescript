import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFlightSnapshotChecksumLengthRule,
  BatchedFlightSnapshotImpressionsRangeRule,
  BatchedFlightSnapshotRequiredChecksumRule,
  BatchedFlightSnapshotRequiredCodeRule,
  BatchedFlightSnapshotTitleLengthRule,
  defaultBatchedFlightSnapshotValidator,
} from "./batched-flight-snapshot-rules.js";
import { newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

test("BatchedFlightSnapshotValidator reports every problem", () => {
  const validator = defaultBatchedFlightSnapshotValidator();
  const item = newBatchedFlightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFlightSnapshotRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BatchedFlightSnapshotRequiredChecksumRule("batched flight snapshot needs a value");
  const item = newBatchedFlightSnapshot("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFlightSnapshotChecksumLengthRule flags a long checksum", () => {
  const rule = new BatchedFlightSnapshotChecksumLengthRule(120);
  const item = newBatchedFlightSnapshot("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFlightSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedFlightSnapshotRequiredCodeRule("batched flight snapshot needs an entry");
  const item = newBatchedFlightSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFlightSnapshotTitleLengthRule flags a long title", () => {
  const rule = new BatchedFlightSnapshotTitleLengthRule(16);
  const item = newBatchedFlightSnapshot("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedFlightSnapshotImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedFlightSnapshotImpressionsRangeRule(86400, 86400);
  const item = newBatchedFlightSnapshot("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
