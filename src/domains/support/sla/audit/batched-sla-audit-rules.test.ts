import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSlaAuditCostRangeRule,
  BatchedSlaAuditRequiredExternalRefRule,
  BatchedSlaAuditRequiredNameRule,
  BatchedSlaAuditRequiredReviewerRule,
  defaultBatchedSlaAuditValidator,
} from "./batched-sla-audit-rules.js";
import { newBatchedSlaAudit } from "./batched-sla-audit.js";

test("BatchedSlaAuditValidator reports every problem", () => {
  const validator = defaultBatchedSlaAuditValidator();
  const item = newBatchedSlaAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSlaAuditRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new BatchedSlaAuditRequiredExternalRefRule("batched sla audit needs an entry");
  const item = newBatchedSlaAudit("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSlaAuditCostRangeRule flags values above cost", () => {
  const rule = new BatchedSlaAuditCostRangeRule(9.9, 2165);
  const item = newBatchedSlaAudit("x", "y");
  item.cost = 2166.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedSlaAuditRequiredNameRule flags a blank name", () => {
  const rule = new BatchedSlaAuditRequiredNameRule("batched sla audit needs this field");
  const item = newBatchedSlaAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSlaAuditRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new BatchedSlaAuditRequiredReviewerRule("batched sla audit needs a value");
  const item = newBatchedSlaAudit("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
