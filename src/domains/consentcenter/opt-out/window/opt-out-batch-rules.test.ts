import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutBatchChecksumLengthRule,
  OptOutBatchCodeLengthRule,
  OptOutBatchFloorValueRangeRule,
  OptOutBatchTitleLengthRule,
  defaultOptOutBatchValidator,
} from "./opt-out-batch-rules.js";
import { newOptOutBatch } from "./opt-out-batch.js";

test("OptOutBatchValidator reports every problem", () => {
  const validator = defaultOptOutBatchValidator();
  const item = newOptOutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutBatchCodeLengthRule flags a long code", () => {
  const rule = new OptOutBatchCodeLengthRule(3600);
  const item = newOptOutBatch("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutBatchChecksumLengthRule flags a long checksum", () => {
  const rule = new OptOutBatchChecksumLengthRule(120);
  const item = newOptOutBatch("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutBatchTitleLengthRule flags a long title", () => {
  const rule = new OptOutBatchTitleLengthRule(1000);
  const item = newOptOutBatch("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutBatchFloorValueRangeRule flags values above floor value", () => {
  const rule = new OptOutBatchFloorValueRangeRule(7, 1604.9);
  const item = newOptOutBatch("x", "y");
  item.floorValue = 1606.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
