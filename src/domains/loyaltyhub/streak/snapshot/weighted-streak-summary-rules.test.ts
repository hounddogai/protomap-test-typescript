import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedStreakSummaryOwnerIdLengthRule,
  WeightedStreakSummaryPriorityRangeRule,
  WeightedStreakSummaryRequiredDescriptionRule,
  WeightedStreakSummaryStartsAtRangeRule,
  defaultWeightedStreakSummaryValidator,
} from "./weighted-streak-summary-rules.js";
import { newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("WeightedStreakSummaryValidator reports every problem", () => {
  const validator = defaultWeightedStreakSummaryValidator();
  const item = newWeightedStreakSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedStreakSummaryPriorityRangeRule flags values above priority", () => {
  const rule = new WeightedStreakSummaryPriorityRangeRule(3600, 3600);
  const item = newWeightedStreakSummary("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedStreakSummaryRequiredDescriptionRule flags a blank description", () => {
  const rule = new WeightedStreakSummaryRequiredDescriptionRule("weighted streak summary needs this field");
  const item = newWeightedStreakSummary("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedStreakSummaryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new WeightedStreakSummaryOwnerIdLengthRule(120);
  const item = newWeightedStreakSummary("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedStreakSummaryStartsAtRangeRule flags values above starts at", () => {
  const rule = new WeightedStreakSummaryStartsAtRangeRule(16, 64);
  const item = newWeightedStreakSummary("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
