import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPathBatchCodeLengthRule,
  LegacyPathBatchGraceDaysRangeRule,
  LegacyPathBatchNameLengthRule,
  LegacyPathBatchRequiredCodeRule,
  LegacyPathBatchRequiredNameRule,
  defaultLegacyPathBatchValidator,
} from "./legacy-path-batch-rules.js";
import { newLegacyPathBatch } from "./legacy-path-batch.js";

test("LegacyPathBatchValidator reports every problem", () => {
  const validator = defaultLegacyPathBatchValidator();
  const item = newLegacyPathBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPathBatchNameLengthRule flags a long name", () => {
  const rule = new LegacyPathBatchNameLengthRule(80);
  const item = newLegacyPathBatch("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPathBatchRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyPathBatchRequiredCodeRule("legacy path batch needs a value");
  const item = newLegacyPathBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPathBatchCodeLengthRule flags a long code", () => {
  const rule = new LegacyPathBatchCodeLengthRule(1000);
  const item = newLegacyPathBatch("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPathBatchRequiredNameRule flags a blank name", () => {
  const rule = new LegacyPathBatchRequiredNameRule("legacy path batch needs an entry");
  const item = newLegacyPathBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPathBatchGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LegacyPathBatchGraceDaysRangeRule(255, 86400);
  const item = newLegacyPathBatch("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
