import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMentionLedgerCapacityRangeRule,
  BatchedMentionLedgerCategoryLengthRule,
  BatchedMentionLedgerCostRangeRule,
  BatchedMentionLedgerRequiredCategoryRule,
  BatchedMentionLedgerTitleLengthRule,
  defaultBatchedMentionLedgerValidator,
} from "./batched-mention-ledger-rules.js";
import { newBatchedMentionLedger } from "./batched-mention-ledger.js";

test("BatchedMentionLedgerValidator reports every problem", () => {
  const validator = defaultBatchedMentionLedgerValidator();
  const item = newBatchedMentionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMentionLedgerCategoryLengthRule flags a long category", () => {
  const rule = new BatchedMentionLedgerCategoryLengthRule(1000);
  const item = newBatchedMentionLedger("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMentionLedgerCapacityRangeRule flags values above capacity", () => {
  const rule = new BatchedMentionLedgerCapacityRangeRule(120, 1000);
  const item = newBatchedMentionLedger("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMentionLedgerTitleLengthRule flags a long title", () => {
  const rule = new BatchedMentionLedgerTitleLengthRule(120);
  const item = newBatchedMentionLedger("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMentionLedgerRequiredCategoryRule flags a blank category", () => {
  const rule = new BatchedMentionLedgerRequiredCategoryRule("batched mention ledger needs an entry");
  const item = newBatchedMentionLedger("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMentionLedgerCostRangeRule flags values above cost", () => {
  const rule = new BatchedMentionLedgerCostRangeRule(7.5, 3577.2);
  const item = newBatchedMentionLedger("x", "y");
  item.cost = 3578.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
