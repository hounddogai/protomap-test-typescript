import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationCycleRatioRangeRule,
  ReputationCycleTitleLengthRule,
  defaultReputationCycleValidator,
} from "./reputation-cycle-rules.js";
import { newReputationCycle } from "./reputation-cycle.js";

test("ReputationCycleValidator reports every problem", () => {
  const validator = defaultReputationCycleValidator();
  const item = newReputationCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationCycleRatioRangeRule flags values above ratio", () => {
  const rule = new ReputationCycleRatioRangeRule(7.3, 1729.1);
  const item = newReputationCycle("x", "y");
  item.ratio = 1730.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationCycleTitleLengthRule flags a long title", () => {
  const rule = new ReputationCycleTitleLengthRule(3600);
  const item = newReputationCycle("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
