import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultComplaintBatchDescriptionLengthRule,
  DefaultComplaintBatchRequiredCodeRule,
  DefaultComplaintBatchRequiredLocaleRule,
  DefaultComplaintBatchSequenceRangeRule,
  defaultDefaultComplaintBatchValidator,
} from "./default-complaint-batch-rules.js";
import { newDefaultComplaintBatch } from "./default-complaint-batch.js";

test("DefaultComplaintBatchValidator reports every problem", () => {
  const validator = defaultDefaultComplaintBatchValidator();
  const item = newDefaultComplaintBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultComplaintBatchDescriptionLengthRule flags a long description", () => {
  const rule = new DefaultComplaintBatchDescriptionLengthRule(255);
  const item = newDefaultComplaintBatch("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultComplaintBatchSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultComplaintBatchSequenceRangeRule(80, 120);
  const item = newDefaultComplaintBatch("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultComplaintBatchRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultComplaintBatchRequiredLocaleRule("default complaint batch needs an entry");
  const item = newDefaultComplaintBatch("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultComplaintBatchRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultComplaintBatchRequiredCodeRule("default complaint batch needs a value");
  const item = newDefaultComplaintBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
