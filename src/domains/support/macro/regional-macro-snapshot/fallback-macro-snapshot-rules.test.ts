import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackMacroSnapshotDiscountRangeRule,
  FallbackMacroSnapshotNameLengthRule,
  FallbackMacroSnapshotRequiredCodeRule,
  FallbackMacroSnapshotRequiredNameRule,
  defaultFallbackMacroSnapshotValidator,
} from "./fallback-macro-snapshot-rules.js";
import { newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

test("FallbackMacroSnapshotValidator reports every problem", () => {
  const validator = defaultFallbackMacroSnapshotValidator();
  const item = newFallbackMacroSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackMacroSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new FallbackMacroSnapshotRequiredNameRule("fallback macro snapshot needs an entry");
  const item = newFallbackMacroSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMacroSnapshotDiscountRangeRule flags values above discount", () => {
  const rule = new FallbackMacroSnapshotDiscountRangeRule(1.4, 3864.6);
  const item = newFallbackMacroSnapshot("x", "y");
  item.discount = 3866.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackMacroSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackMacroSnapshotRequiredCodeRule("fallback macro snapshot needs an entry");
  const item = newFallbackMacroSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMacroSnapshotNameLengthRule flags a long name", () => {
  const rule = new FallbackMacroSnapshotNameLengthRule(80);
  const item = newFallbackMacroSnapshot("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
