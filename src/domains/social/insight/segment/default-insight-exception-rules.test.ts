import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInsightExceptionBatchSizeRangeRule,
  DefaultInsightExceptionCodeLengthRule,
  DefaultInsightExceptionRequiredCodeRule,
  DefaultInsightExceptionRequiredTitleRule,
  DefaultInsightExceptionSequenceRangeRule,
  defaultDefaultInsightExceptionValidator,
} from "./default-insight-exception-rules.js";
import { newDefaultInsightException } from "./default-insight-exception.js";

test("DefaultInsightExceptionValidator reports every problem", () => {
  const validator = defaultDefaultInsightExceptionValidator();
  const item = newDefaultInsightException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInsightExceptionBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DefaultInsightExceptionBatchSizeRangeRule(120, 1000);
  const item = newDefaultInsightException("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultInsightExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultInsightExceptionRequiredTitleRule("default insight exception needs a value");
  const item = newDefaultInsightException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInsightExceptionCodeLengthRule flags a long code", () => {
  const rule = new DefaultInsightExceptionCodeLengthRule(120);
  const item = newDefaultInsightException("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultInsightExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultInsightExceptionRequiredCodeRule("default insight exception needs this field");
  const item = newDefaultInsightException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInsightExceptionSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultInsightExceptionSequenceRangeRule(120, 255);
  const item = newDefaultInsightException("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
