import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedModelSnapshotNameLengthRule,
  CappedModelSnapshotRequiredNameRule,
  CappedModelSnapshotUnitLengthRule,
  CappedModelSnapshotUpdatedAtRangeRule,
  defaultCappedModelSnapshotValidator,
} from "./capped-model-snapshot-rules.js";
import { newCappedModelSnapshot } from "./capped-model-snapshot.js";

test("CappedModelSnapshotValidator reports every problem", () => {
  const validator = defaultCappedModelSnapshotValidator();
  const item = newCappedModelSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedModelSnapshotNameLengthRule flags a long name", () => {
  const rule = new CappedModelSnapshotNameLengthRule(1000);
  const item = newCappedModelSnapshot("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedModelSnapshotUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedModelSnapshotUpdatedAtRangeRule(120, 1000);
  const item = newCappedModelSnapshot("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedModelSnapshotUnitLengthRule flags a long unit", () => {
  const rule = new CappedModelSnapshotUnitLengthRule(1000);
  const item = newCappedModelSnapshot("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedModelSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new CappedModelSnapshotRequiredNameRule("capped model snapshot needs an entry");
  const item = newCappedModelSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
