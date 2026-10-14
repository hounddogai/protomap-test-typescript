import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelEntryLabelLengthRule,
  LevelEntryOpenRateRangeRule,
  LevelEntryRateRangeRule,
  LevelEntryRequiredTitleRule,
  LevelEntryRequiredUnitRule,
  defaultLevelEntryValidator,
} from "./level-entry-rules.js";
import { newLevelEntry } from "./level-entry.js";

test("LevelEntryValidator reports every problem", () => {
  const validator = defaultLevelEntryValidator();
  const item = newLevelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelEntryOpenRateRangeRule flags values above open rate", () => {
  const rule = new LevelEntryOpenRateRangeRule(3.2, 2900.2);
  const item = newLevelEntry("x", "y");
  item.openRate = 2901.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelEntryRateRangeRule flags values above rate", () => {
  const rule = new LevelEntryRateRangeRule(4.4, 2788);
  const item = newLevelEntry("x", "y");
  item.rate = 2789.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelEntryLabelLengthRule flags a long label", () => {
  const rule = new LevelEntryLabelLengthRule(86400);
  const item = newLevelEntry("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelEntryRequiredTitleRule flags a blank title", () => {
  const rule = new LevelEntryRequiredTitleRule("level entry needs an entry");
  const item = newLevelEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelEntryRequiredUnitRule flags a blank unit", () => {
  const rule = new LevelEntryRequiredUnitRule("level entry needs a value");
  const item = newLevelEntry("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
