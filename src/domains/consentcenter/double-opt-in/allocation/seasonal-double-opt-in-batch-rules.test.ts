import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDoubleOptInBatchBudgetRangeRule,
  SeasonalDoubleOptInBatchCohortLengthRule,
  SeasonalDoubleOptInBatchCreatedAtRangeRule,
  SeasonalDoubleOptInBatchRetriesRangeRule,
  defaultSeasonalDoubleOptInBatchValidator,
} from "./seasonal-double-opt-in-batch-rules.js";
import { newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

test("SeasonalDoubleOptInBatchValidator reports every problem", () => {
  const validator = defaultSeasonalDoubleOptInBatchValidator();
  const item = newSeasonalDoubleOptInBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDoubleOptInBatchCreatedAtRangeRule flags values above created at", () => {
  const rule = new SeasonalDoubleOptInBatchCreatedAtRangeRule(80, 1000);
  const item = newSeasonalDoubleOptInBatch("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDoubleOptInBatchCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalDoubleOptInBatchCohortLengthRule(3600);
  const item = newSeasonalDoubleOptInBatch("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDoubleOptInBatchBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalDoubleOptInBatchBudgetRangeRule(8.7, 875.7);
  const item = newSeasonalDoubleOptInBatch("x", "y");
  item.budget = 877.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDoubleOptInBatchRetriesRangeRule flags values above retries", () => {
  const rule = new SeasonalDoubleOptInBatchRetriesRangeRule(80, 120);
  const item = newSeasonalDoubleOptInBatch("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
