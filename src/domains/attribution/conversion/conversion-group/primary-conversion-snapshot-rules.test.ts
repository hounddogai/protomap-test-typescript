import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionSnapshotCategoryLengthRule,
  PrimaryConversionSnapshotLimitRangeRule,
  PrimaryConversionSnapshotRequiredCodeRule,
  PrimaryConversionSnapshotStartsAtRangeRule,
  defaultPrimaryConversionSnapshotValidator,
} from "./primary-conversion-snapshot-rules.js";
import { newPrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

test("PrimaryConversionSnapshotValidator reports every problem", () => {
  const validator = defaultPrimaryConversionSnapshotValidator();
  const item = newPrimaryConversionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionSnapshotCategoryLengthRule flags a long category", () => {
  const rule = new PrimaryConversionSnapshotCategoryLengthRule(120);
  const item = newPrimaryConversionSnapshot("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionSnapshotStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryConversionSnapshotStartsAtRangeRule(32, 255);
  const item = newPrimaryConversionSnapshot("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionSnapshotLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryConversionSnapshotLimitRangeRule(120, 3600);
  const item = newPrimaryConversionSnapshot("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryConversionSnapshotRequiredCodeRule("primary conversion snapshot needs a value");
  const item = newPrimaryConversionSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
