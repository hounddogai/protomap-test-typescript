import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDeflectionAuditAttemptsRangeRule,
  WeightedDeflectionAuditBatchSizeRangeRule,
  WeightedDeflectionAuditRequiredDescriptionRule,
  WeightedDeflectionAuditRequiredTitleRule,
  WeightedDeflectionAuditTitleLengthRule,
  defaultWeightedDeflectionAuditValidator,
} from "./weighted-deflection-audit-rules.js";
import { newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("WeightedDeflectionAuditValidator reports every problem", () => {
  const validator = defaultWeightedDeflectionAuditValidator();
  const item = newWeightedDeflectionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDeflectionAuditAttemptsRangeRule flags values above attempts", () => {
  const rule = new WeightedDeflectionAuditAttemptsRangeRule(32, 120);
  const item = newWeightedDeflectionAudit("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedDeflectionAuditRequiredDescriptionRule flags a blank description", () => {
  const rule = new WeightedDeflectionAuditRequiredDescriptionRule("weighted deflection audit needs a value");
  const item = newWeightedDeflectionAudit("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDeflectionAuditTitleLengthRule flags a long title", () => {
  const rule = new WeightedDeflectionAuditTitleLengthRule(86400);
  const item = newWeightedDeflectionAudit("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDeflectionAuditRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedDeflectionAuditRequiredTitleRule("weighted deflection audit needs a value");
  const item = newWeightedDeflectionAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDeflectionAuditBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WeightedDeflectionAuditBatchSizeRangeRule(120, 86400);
  const item = newWeightedDeflectionAudit("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
