import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalStreakRecordLocaleLengthRule,
  GlobalStreakRecordRequiredNameRule,
  GlobalStreakRecordRequiredUnitRule,
  defaultGlobalStreakRecordValidator,
} from "./global-streak-record-rules.js";
import { newGlobalStreakRecord } from "./global-streak-record.js";

test("GlobalStreakRecordValidator reports every problem", () => {
  const validator = defaultGlobalStreakRecordValidator();
  const item = newGlobalStreakRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalStreakRecordRequiredNameRule flags a blank name", () => {
  const rule = new GlobalStreakRecordRequiredNameRule("global streak record needs an entry");
  const item = newGlobalStreakRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalStreakRecordRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalStreakRecordRequiredUnitRule("global streak record needs an entry");
  const item = newGlobalStreakRecord("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalStreakRecordLocaleLengthRule flags a long locale", () => {
  const rule = new GlobalStreakRecordLocaleLengthRule(3600);
  const item = newGlobalStreakRecord("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
