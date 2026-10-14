import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedExitRuleRecordDurationMinutesRangeRule,
  BatchedExitRuleRecordLabelLengthRule,
  defaultBatchedExitRuleRecordValidator,
} from "./batched-exit-rule-record-rules.js";
import { newBatchedExitRuleRecord } from "./batched-exit-rule-record.js";

test("BatchedExitRuleRecordValidator reports every problem", () => {
  const validator = defaultBatchedExitRuleRecordValidator();
  const item = newBatchedExitRuleRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedExitRuleRecordDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BatchedExitRuleRecordDurationMinutesRangeRule(32, 3600);
  const item = newBatchedExitRuleRecord("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedExitRuleRecordLabelLengthRule flags a long label", () => {
  const rule = new BatchedExitRuleRecordLabelLengthRule(32);
  const item = newBatchedExitRuleRecord("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
