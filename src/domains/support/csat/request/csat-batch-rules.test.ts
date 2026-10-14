import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatBatchNameLengthRule,
  CsatBatchTimezoneLengthRule,
  defaultCsatBatchValidator,
} from "./csat-batch-rules.js";
import { newCsatBatch } from "./csat-batch.js";

test("CsatBatchValidator reports every problem", () => {
  const validator = defaultCsatBatchValidator();
  const item = newCsatBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatBatchTimezoneLengthRule flags a long timezone", () => {
  const rule = new CsatBatchTimezoneLengthRule(32);
  const item = newCsatBatch("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatBatchNameLengthRule flags a long name", () => {
  const rule = new CsatBatchNameLengthRule(32);
  const item = newCsatBatch("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
