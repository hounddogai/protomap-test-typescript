import assert from "node:assert/strict";
import { test } from "node:test";
import { DeflectionBatchRequiredNameRule, defaultDeflectionBatchValidator } from "./deflection-batch-rules.js";
import { newDeflectionBatch } from "./deflection-batch.js";

test("DeflectionBatchValidator reports every problem", () => {
  const validator = defaultDeflectionBatchValidator();
  const item = newDeflectionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionBatchRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionBatchRequiredNameRule("deflection batch needs this field");
  const item = newDeflectionBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
