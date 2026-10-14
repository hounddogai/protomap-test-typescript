import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupRecordNameLengthRule,
  LenientWarmupRecordRequiredNameRule,
  LenientWarmupRecordRequiredTitleRule,
  LenientWarmupRecordStartsAtRangeRule,
  defaultLenientWarmupRecordValidator,
} from "./lenient-warmup-record-rules.js";
import { newLenientWarmupRecord } from "./lenient-warmup-record.js";

test("LenientWarmupRecordValidator reports every problem", () => {
  const validator = defaultLenientWarmupRecordValidator();
  const item = newLenientWarmupRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupRecordRequiredTitleRule flags a blank title", () => {
  const rule = new LenientWarmupRecordRequiredTitleRule("lenient warmup record needs a value");
  const item = newLenientWarmupRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupRecordStartsAtRangeRule flags values above starts at", () => {
  const rule = new LenientWarmupRecordStartsAtRangeRule(120, 3600);
  const item = newLenientWarmupRecord("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWarmupRecordRequiredNameRule flags a blank name", () => {
  const rule = new LenientWarmupRecordRequiredNameRule("lenient warmup record needs an entry");
  const item = newLenientWarmupRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupRecordNameLengthRule flags a long name", () => {
  const rule = new LenientWarmupRecordNameLengthRule(3600);
  const item = newLenientWarmupRecord("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
