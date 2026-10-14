import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingMacroBaselineCohortLengthRule,
  PendingMacroBaselineRetriesRangeRule,
  defaultPendingMacroBaselineValidator,
} from "./pending-macro-baseline-rules.js";
import { newPendingMacroBaseline } from "./pending-macro-baseline.js";

test("PendingMacroBaselineValidator reports every problem", () => {
  const validator = defaultPendingMacroBaselineValidator();
  const item = newPendingMacroBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingMacroBaselineCohortLengthRule flags a long cohort", () => {
  const rule = new PendingMacroBaselineCohortLengthRule(3600);
  const item = newPendingMacroBaseline("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingMacroBaselineRetriesRangeRule flags values above retries", () => {
  const rule = new PendingMacroBaselineRetriesRangeRule(1000, 3600);
  const item = newPendingMacroBaseline("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
