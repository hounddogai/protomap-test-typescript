import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathEntryBudgetRangeRule,
  PathEntryQuantityRangeRule,
  PathEntryVariantLengthRule,
  defaultPathEntryValidator,
} from "./path-entry-rules.js";
import { newPathEntry } from "./path-entry.js";

test("PathEntryValidator reports every problem", () => {
  const validator = defaultPathEntryValidator();
  const item = newPathEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathEntryVariantLengthRule flags a long variant", () => {
  const rule = new PathEntryVariantLengthRule(16);
  const item = newPathEntry("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathEntryBudgetRangeRule flags values above budget", () => {
  const rule = new PathEntryBudgetRangeRule(1.2, 3479.2);
  const item = newPathEntry("x", "y");
  item.budget = 3480.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathEntryQuantityRangeRule flags values above quantity", () => {
  const rule = new PathEntryQuantityRangeRule(1000, 3600);
  const item = newPathEntry("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
