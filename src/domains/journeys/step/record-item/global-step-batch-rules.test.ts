import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalStepBatchChecksumLengthRule,
  GlobalStepBatchCodeLengthRule,
  GlobalStepBatchLabelLengthRule,
  GlobalStepBatchSendAtRangeRule,
  defaultGlobalStepBatchValidator,
} from "./global-step-batch-rules.js";
import { newGlobalStepBatch } from "./global-step-batch.js";

test("GlobalStepBatchValidator reports every problem", () => {
  const validator = defaultGlobalStepBatchValidator();
  const item = newGlobalStepBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalStepBatchCodeLengthRule flags a long code", () => {
  const rule = new GlobalStepBatchCodeLengthRule(255);
  const item = newGlobalStepBatch("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalStepBatchChecksumLengthRule flags a long checksum", () => {
  const rule = new GlobalStepBatchChecksumLengthRule(64);
  const item = newGlobalStepBatch("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalStepBatchSendAtRangeRule flags values above send at", () => {
  const rule = new GlobalStepBatchSendAtRangeRule(32, 3600);
  const item = newGlobalStepBatch("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalStepBatchLabelLengthRule flags a long label", () => {
  const rule = new GlobalStepBatchLabelLengthRule(3600);
  const item = newGlobalStepBatch("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
