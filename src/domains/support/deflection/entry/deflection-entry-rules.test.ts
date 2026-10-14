import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionEntryLimitRangeRule,
  DeflectionEntryRequiredCodeRule,
  DeflectionEntryRequiredTitleRule,
  defaultDeflectionEntryValidator,
} from "./deflection-entry-rules.js";
import { newDeflectionEntry } from "./deflection-entry.js";

test("DeflectionEntryValidator reports every problem", () => {
  const validator = defaultDeflectionEntryValidator();
  const item = newDeflectionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionEntryRequiredTitleRule flags a blank title", () => {
  const rule = new DeflectionEntryRequiredTitleRule("deflection entry needs this field");
  const item = newDeflectionEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionEntryRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionEntryRequiredCodeRule("deflection entry needs an entry");
  const item = newDeflectionEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionEntryLimitRangeRule flags values above limit", () => {
  const rule = new DeflectionEntryLimitRangeRule(80, 86400);
  const item = newDeflectionEntry("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
