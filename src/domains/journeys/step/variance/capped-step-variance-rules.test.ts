import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStepVarianceDescriptionLengthRule,
  CappedStepVarianceRetriesRangeRule,
  CappedStepVarianceStartsAtRangeRule,
  CappedStepVarianceTitleLengthRule,
  defaultCappedStepVarianceValidator,
} from "./capped-step-variance-rules.js";
import { newCappedStepVariance } from "./capped-step-variance.js";

test("CappedStepVarianceValidator reports every problem", () => {
  const validator = defaultCappedStepVarianceValidator();
  const item = newCappedStepVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStepVarianceTitleLengthRule flags a long title", () => {
  const rule = new CappedStepVarianceTitleLengthRule(120);
  const item = newCappedStepVariance("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStepVarianceRetriesRangeRule flags values above retries", () => {
  const rule = new CappedStepVarianceRetriesRangeRule(120, 1000);
  const item = newCappedStepVariance("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedStepVarianceStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedStepVarianceStartsAtRangeRule(16, 32);
  const item = newCappedStepVariance("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedStepVarianceDescriptionLengthRule flags a long description", () => {
  const rule = new CappedStepVarianceDescriptionLengthRule(3600);
  const item = newCappedStepVariance("x", "y");
  item.description = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
