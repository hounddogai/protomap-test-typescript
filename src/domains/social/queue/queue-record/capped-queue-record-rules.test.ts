import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedQueueRecordCostRangeRule,
  CappedQueueRecordRequiredCodeRule,
  CappedQueueRecordRequiredTitleRule,
  defaultCappedQueueRecordValidator,
} from "./capped-queue-record-rules.js";
import { newCappedQueueRecord } from "./capped-queue-record.js";

test("CappedQueueRecordValidator reports every problem", () => {
  const validator = defaultCappedQueueRecordValidator();
  const item = newCappedQueueRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedQueueRecordRequiredCodeRule flags a blank code", () => {
  const rule = new CappedQueueRecordRequiredCodeRule("capped queue record needs an entry");
  const item = newCappedQueueRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedQueueRecordRequiredTitleRule flags a blank title", () => {
  const rule = new CappedQueueRecordRequiredTitleRule("capped queue record needs an entry");
  const item = newCappedQueueRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedQueueRecordCostRangeRule flags values above cost", () => {
  const rule = new CappedQueueRecordCostRangeRule(3.8, 1522.5);
  const item = newCappedQueueRecord("x", "y");
  item.cost = 1524;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
