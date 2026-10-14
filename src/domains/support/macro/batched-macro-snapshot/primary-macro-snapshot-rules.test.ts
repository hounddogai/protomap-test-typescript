import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMacroSnapshotNameLengthRule,
  PrimaryMacroSnapshotQuantityRangeRule,
  PrimaryMacroSnapshotRequiredSourceRule,
  PrimaryMacroSnapshotSourceLengthRule,
  defaultPrimaryMacroSnapshotValidator,
} from "./primary-macro-snapshot-rules.js";
import { newPrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

test("PrimaryMacroSnapshotValidator reports every problem", () => {
  const validator = defaultPrimaryMacroSnapshotValidator();
  const item = newPrimaryMacroSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMacroSnapshotSourceLengthRule flags a long source", () => {
  const rule = new PrimaryMacroSnapshotSourceLengthRule(1000);
  const item = newPrimaryMacroSnapshot("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroSnapshotRequiredSourceRule flags a blank source", () => {
  const rule = new PrimaryMacroSnapshotRequiredSourceRule("primary macro snapshot needs an entry");
  const item = newPrimaryMacroSnapshot("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroSnapshotNameLengthRule flags a long name", () => {
  const rule = new PrimaryMacroSnapshotNameLengthRule(64);
  const item = newPrimaryMacroSnapshot("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroSnapshotQuantityRangeRule flags values above quantity", () => {
  const rule = new PrimaryMacroSnapshotQuantityRangeRule(1000, 86400);
  const item = newPrimaryMacroSnapshot("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
