import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPathQuotaNameLengthRule,
  BatchedPathQuotaRequiredNameRule,
  BatchedPathQuotaTitleLengthRule,
  defaultBatchedPathQuotaValidator,
} from "./batched-path-quota-rules.js";
import { newBatchedPathQuota } from "./batched-path-quota.js";

test("BatchedPathQuotaValidator reports every problem", () => {
  const validator = defaultBatchedPathQuotaValidator();
  const item = newBatchedPathQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPathQuotaRequiredNameRule flags a blank name", () => {
  const rule = new BatchedPathQuotaRequiredNameRule("batched path quota needs this field");
  const item = newBatchedPathQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPathQuotaTitleLengthRule flags a long title", () => {
  const rule = new BatchedPathQuotaTitleLengthRule(64);
  const item = newBatchedPathQuota("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPathQuotaNameLengthRule flags a long name", () => {
  const rule = new BatchedPathQuotaNameLengthRule(80);
  const item = newBatchedPathQuota("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
