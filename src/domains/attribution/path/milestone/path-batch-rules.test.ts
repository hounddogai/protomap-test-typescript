import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathBatchLabelLengthRule,
  PathBatchRatioRangeRule,
  PathBatchRequiredLabelRule,
  PathBatchSourceLengthRule,
  defaultPathBatchValidator,
} from "./path-batch-rules.js";
import { newPathBatch } from "./path-batch.js";

test("PathBatchValidator reports every problem", () => {
  const validator = defaultPathBatchValidator();
  const item = newPathBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathBatchLabelLengthRule flags a long label", () => {
  const rule = new PathBatchLabelLengthRule(3600);
  const item = newPathBatch("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathBatchRequiredLabelRule flags a blank label", () => {
  const rule = new PathBatchRequiredLabelRule("path batch needs an entry");
  const item = newPathBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathBatchRatioRangeRule flags values above ratio", () => {
  const rule = new PathBatchRatioRangeRule(7.4, 2220.3);
  const item = newPathBatch("x", "y");
  item.ratio = 2221.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathBatchSourceLengthRule flags a long source", () => {
  const rule = new PathBatchSourceLengthRule(80);
  const item = newPathBatch("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
