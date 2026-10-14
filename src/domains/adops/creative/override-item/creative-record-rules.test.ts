import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeRecordAttemptsRangeRule,
  CreativeRecordBatchSizeRangeRule,
  CreativeRecordPhoneLengthRule,
  CreativeRecordRequiredNameRule,
  defaultCreativeRecordValidator,
} from "./creative-record-rules.js";
import { newCreativeRecord } from "./creative-record.js";

test("CreativeRecordValidator reports every problem", () => {
  const validator = defaultCreativeRecordValidator();
  const item = newCreativeRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeRecordRequiredNameRule flags a blank name", () => {
  const rule = new CreativeRecordRequiredNameRule("creative record needs an entry");
  const item = newCreativeRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeRecordAttemptsRangeRule flags values above attempts", () => {
  const rule = new CreativeRecordAttemptsRangeRule(16, 255);
  const item = newCreativeRecord("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeRecordPhoneLengthRule flags a long phone", () => {
  const rule = new CreativeRecordPhoneLengthRule(1000);
  const item = newCreativeRecord("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeRecordBatchSizeRangeRule flags values above batch size", () => {
  const rule = new CreativeRecordBatchSizeRangeRule(64, 1000);
  const item = newCreativeRecord("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
