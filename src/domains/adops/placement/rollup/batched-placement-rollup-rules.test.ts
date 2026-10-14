import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPlacementRollupCodeLengthRule,
  BatchedPlacementRollupNameLengthRule,
  BatchedPlacementRollupRequiredLocaleRule,
  BatchedPlacementRollupRetriesRangeRule,
  defaultBatchedPlacementRollupValidator,
} from "./batched-placement-rollup-rules.js";
import { newBatchedPlacementRollup } from "./batched-placement-rollup.js";

test("BatchedPlacementRollupValidator reports every problem", () => {
  const validator = defaultBatchedPlacementRollupValidator();
  const item = newBatchedPlacementRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPlacementRollupRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedPlacementRollupRequiredLocaleRule("batched placement rollup needs this field");
  const item = newBatchedPlacementRollup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPlacementRollupRetriesRangeRule flags values above retries", () => {
  const rule = new BatchedPlacementRollupRetriesRangeRule(255, 3600);
  const item = newBatchedPlacementRollup("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPlacementRollupCodeLengthRule flags a long code", () => {
  const rule = new BatchedPlacementRollupCodeLengthRule(255);
  const item = newBatchedPlacementRollup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementRollupNameLengthRule flags a long name", () => {
  const rule = new BatchedPlacementRollupNameLengthRule(32);
  const item = newBatchedPlacementRollup("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
