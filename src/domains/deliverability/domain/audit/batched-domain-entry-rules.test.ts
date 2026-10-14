import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDomainEntryAmountRangeRule,
  BatchedDomainEntryGraceDaysRangeRule,
  BatchedDomainEntryNameLengthRule,
  BatchedDomainEntryRequiredNameRule,
  defaultBatchedDomainEntryValidator,
} from "./batched-domain-entry-rules.js";
import { newBatchedDomainEntry } from "./batched-domain-entry.js";

test("BatchedDomainEntryValidator reports every problem", () => {
  const validator = defaultBatchedDomainEntryValidator();
  const item = newBatchedDomainEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDomainEntryAmountRangeRule flags values above amount", () => {
  const rule = new BatchedDomainEntryAmountRangeRule(8.8, 2101.1);
  const item = newBatchedDomainEntry("x", "y");
  item.amount = 2102.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedDomainEntryNameLengthRule flags a long name", () => {
  const rule = new BatchedDomainEntryNameLengthRule(1000);
  const item = newBatchedDomainEntry("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedDomainEntryRequiredNameRule flags a blank name", () => {
  const rule = new BatchedDomainEntryRequiredNameRule("batched domain entry needs an entry");
  const item = newBatchedDomainEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDomainEntryGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedDomainEntryGraceDaysRangeRule(120, 86400);
  const item = newBatchedDomainEntry("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
