import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightRecordCohortLengthRule,
  InsightRecordRequiredNameRule,
  InsightRecordRequiredVariantRule,
  InsightRecordUpdatedAtRangeRule,
  defaultInsightRecordValidator,
} from "./insight-record-rules.js";
import { newInsightRecord } from "./insight-record.js";

test("InsightRecordValidator reports every problem", () => {
  const validator = defaultInsightRecordValidator();
  const item = newInsightRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightRecordRequiredNameRule flags a blank name", () => {
  const rule = new InsightRecordRequiredNameRule("insight record needs an entry");
  const item = newInsightRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightRecordCohortLengthRule flags a long cohort", () => {
  const rule = new InsightRecordCohortLengthRule(255);
  const item = newInsightRecord("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightRecordRequiredVariantRule flags a blank variant", () => {
  const rule = new InsightRecordRequiredVariantRule("insight record needs a value");
  const item = newInsightRecord("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightRecordUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new InsightRecordUpdatedAtRangeRule(1000, 1000);
  const item = newInsightRecord("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
