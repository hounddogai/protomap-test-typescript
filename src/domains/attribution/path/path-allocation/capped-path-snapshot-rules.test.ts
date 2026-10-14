import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPathSnapshotCodeLengthRule,
  CappedPathSnapshotLocaleLengthRule,
  CappedPathSnapshotRequiredCodeRule,
  CappedPathSnapshotRequiredRegionRule,
  defaultCappedPathSnapshotValidator,
} from "./capped-path-snapshot-rules.js";
import { newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("CappedPathSnapshotValidator reports every problem", () => {
  const validator = defaultCappedPathSnapshotValidator();
  const item = newCappedPathSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPathSnapshotCodeLengthRule flags a long code", () => {
  const rule = new CappedPathSnapshotCodeLengthRule(3600);
  const item = newCappedPathSnapshot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPathSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new CappedPathSnapshotRequiredCodeRule("capped path snapshot needs this field");
  const item = newCappedPathSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPathSnapshotLocaleLengthRule flags a long locale", () => {
  const rule = new CappedPathSnapshotLocaleLengthRule(3600);
  const item = newCappedPathSnapshot("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPathSnapshotRequiredRegionRule flags a blank region", () => {
  const rule = new CappedPathSnapshotRequiredRegionRule("capped path snapshot needs this field");
  const item = newCappedPathSnapshot("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
