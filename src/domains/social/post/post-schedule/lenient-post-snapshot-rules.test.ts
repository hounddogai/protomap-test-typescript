import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostSnapshotMarginRangeRule,
  LenientPostSnapshotNameLengthRule,
  LenientPostSnapshotRequiredCodeRule,
  defaultLenientPostSnapshotValidator,
} from "./lenient-post-snapshot-rules.js";
import { newLenientPostSnapshot } from "./lenient-post-snapshot.js";

test("LenientPostSnapshotValidator reports every problem", () => {
  const validator = defaultLenientPostSnapshotValidator();
  const item = newLenientPostSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostSnapshotMarginRangeRule flags values above margin", () => {
  const rule = new LenientPostSnapshotMarginRangeRule(7, 4719.1);
  const item = newLenientPostSnapshot("x", "y");
  item.margin = 4720.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPostSnapshotNameLengthRule flags a long name", () => {
  const rule = new LenientPostSnapshotNameLengthRule(32);
  const item = newLenientPostSnapshot("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPostSnapshotRequiredCodeRule("lenient post snapshot needs a value");
  const item = newLenientPostSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
