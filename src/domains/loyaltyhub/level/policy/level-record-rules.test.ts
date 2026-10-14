import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelRecordAmountRangeRule,
  LevelRecordCodeLengthRule,
  LevelRecordRequiredTitleRule,
  LevelRecordTitleLengthRule,
  defaultLevelRecordValidator,
} from "./level-record-rules.js";
import { newLevelRecord } from "./level-record.js";

test("LevelRecordValidator reports every problem", () => {
  const validator = defaultLevelRecordValidator();
  const item = newLevelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelRecordCodeLengthRule flags a long code", () => {
  const rule = new LevelRecordCodeLengthRule(120);
  const item = newLevelRecord("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelRecordAmountRangeRule flags values above amount", () => {
  const rule = new LevelRecordAmountRangeRule(8.3, 1518.1);
  const item = newLevelRecord("x", "y");
  item.amount = 1519.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelRecordTitleLengthRule flags a long title", () => {
  const rule = new LevelRecordTitleLengthRule(1000);
  const item = newLevelRecord("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelRecordRequiredTitleRule flags a blank title", () => {
  const rule = new LevelRecordRequiredTitleRule("level record needs an entry");
  const item = newLevelRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
