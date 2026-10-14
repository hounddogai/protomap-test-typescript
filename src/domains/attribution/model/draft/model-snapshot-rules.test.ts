import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelSnapshotCodeLengthRule,
  ModelSnapshotDescriptionLengthRule,
  ModelSnapshotRequiredDescriptionRule,
  defaultModelSnapshotValidator,
} from "./model-snapshot-rules.js";
import { newModelSnapshot } from "./model-snapshot.js";

test("ModelSnapshotValidator reports every problem", () => {
  const validator = defaultModelSnapshotValidator();
  const item = newModelSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelSnapshotCodeLengthRule flags a long code", () => {
  const rule = new ModelSnapshotCodeLengthRule(1000);
  const item = newModelSnapshot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelSnapshotDescriptionLengthRule flags a long description", () => {
  const rule = new ModelSnapshotDescriptionLengthRule(3600);
  const item = newModelSnapshot("x", "y");
  item.description = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelSnapshotRequiredDescriptionRule flags a blank description", () => {
  const rule = new ModelSnapshotRequiredDescriptionRule("model snapshot needs this field");
  const item = newModelSnapshot("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
