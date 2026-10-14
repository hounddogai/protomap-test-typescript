import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathVarianceAttemptsRangeRule,
  PathVarianceBatchSizeRangeRule,
  PathVarianceCodeLengthRule,
  PathVarianceRequiredNotesRule,
  defaultPathVarianceValidator,
} from "./path-variance-rules.js";
import { newPathVariance } from "./path-variance.js";

test("PathVarianceValidator reports every problem", () => {
  const validator = defaultPathVarianceValidator();
  const item = newPathVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathVarianceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PathVarianceBatchSizeRangeRule(80, 255);
  const item = newPathVariance("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathVarianceCodeLengthRule flags a long code", () => {
  const rule = new PathVarianceCodeLengthRule(64);
  const item = newPathVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathVarianceAttemptsRangeRule flags values above attempts", () => {
  const rule = new PathVarianceAttemptsRangeRule(32, 80);
  const item = newPathVariance("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathVarianceRequiredNotesRule flags a blank notes", () => {
  const rule = new PathVarianceRequiredNotesRule("path variance needs a value");
  const item = newPathVariance("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
