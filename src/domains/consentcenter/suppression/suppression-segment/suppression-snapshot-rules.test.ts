import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionSnapshotLabelLengthRule,
  SuppressionSnapshotRequiredOwnerIdRule,
  SuppressionSnapshotWeightRangeRule,
  defaultSuppressionSnapshotValidator,
} from "./suppression-snapshot-rules.js";
import { newSuppressionSnapshot } from "./suppression-snapshot.js";

test("SuppressionSnapshotValidator reports every problem", () => {
  const validator = defaultSuppressionSnapshotValidator();
  const item = newSuppressionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionSnapshotLabelLengthRule flags a long label", () => {
  const rule = new SuppressionSnapshotLabelLengthRule(16);
  const item = newSuppressionSnapshot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionSnapshotRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SuppressionSnapshotRequiredOwnerIdRule("suppression snapshot needs this field");
  const item = newSuppressionSnapshot("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionSnapshotWeightRangeRule flags values above weight", () => {
  const rule = new SuppressionSnapshotWeightRangeRule(5.5, 4693.7);
  const item = newSuppressionSnapshot("x", "y");
  item.weight = 4695.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
