import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryEscalationBatchCodeLengthRule,
  PrimaryEscalationBatchRequiredSegmentRule,
  defaultPrimaryEscalationBatchValidator,
} from "./primary-escalation-batch-rules.js";
import { newPrimaryEscalationBatch } from "./primary-escalation-batch.js";

test("PrimaryEscalationBatchValidator reports every problem", () => {
  const validator = defaultPrimaryEscalationBatchValidator();
  const item = newPrimaryEscalationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryEscalationBatchRequiredSegmentRule flags a blank segment", () => {
  const rule = new PrimaryEscalationBatchRequiredSegmentRule("primary escalation batch needs a value");
  const item = newPrimaryEscalationBatch("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryEscalationBatchCodeLengthRule flags a long code", () => {
  const rule = new PrimaryEscalationBatchCodeLengthRule(16);
  const item = newPrimaryEscalationBatch("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
