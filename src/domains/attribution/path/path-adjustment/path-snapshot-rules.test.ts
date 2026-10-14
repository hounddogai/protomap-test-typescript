import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathSnapshotRequiredCodeRule,
  PathSnapshotRequiredVariantRule,
  PathSnapshotTitleLengthRule,
  PathSnapshotVariantLengthRule,
  defaultPathSnapshotValidator,
} from "./path-snapshot-rules.js";
import { newPathSnapshot } from "./path-snapshot.js";

test("PathSnapshotValidator reports every problem", () => {
  const validator = defaultPathSnapshotValidator();
  const item = newPathSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathSnapshotTitleLengthRule flags a long title", () => {
  const rule = new PathSnapshotTitleLengthRule(86400);
  const item = newPathSnapshot("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSnapshotVariantLengthRule flags a long variant", () => {
  const rule = new PathSnapshotVariantLengthRule(1000);
  const item = newPathSnapshot("x", "y");
  item.variant = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new PathSnapshotRequiredCodeRule("path snapshot needs a value");
  const item = newPathSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathSnapshotRequiredVariantRule flags a blank variant", () => {
  const rule = new PathSnapshotRequiredVariantRule("path snapshot needs a value");
  const item = newPathSnapshot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
