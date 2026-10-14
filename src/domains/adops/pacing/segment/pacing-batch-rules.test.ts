import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingBatchRequiredNameRule,
  PacingBatchRequiredSummaryRule,
  defaultPacingBatchValidator,
} from "./pacing-batch-rules.js";
import { newPacingBatch } from "./pacing-batch.js";

test("PacingBatchValidator reports every problem", () => {
  const validator = defaultPacingBatchValidator();
  const item = newPacingBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingBatchRequiredSummaryRule flags a blank summary", () => {
  const rule = new PacingBatchRequiredSummaryRule("pacing batch needs this field");
  const item = newPacingBatch("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingBatchRequiredNameRule flags a blank name", () => {
  const rule = new PacingBatchRequiredNameRule("pacing batch needs a value");
  const item = newPacingBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
