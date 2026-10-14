import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPlacementGroupCodeLengthRule,
  BatchedPlacementGroupNotesLengthRule,
  BatchedPlacementGroupRequiredLocaleRule,
  BatchedPlacementGroupTitleLengthRule,
  BatchedPlacementGroupVersionRangeRule,
  defaultBatchedPlacementGroupValidator,
} from "./batched-placement-group-rules.js";
import { newBatchedPlacementGroup } from "./batched-placement-group.js";

test("BatchedPlacementGroupValidator reports every problem", () => {
  const validator = defaultBatchedPlacementGroupValidator();
  const item = newBatchedPlacementGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPlacementGroupTitleLengthRule flags a long title", () => {
  const rule = new BatchedPlacementGroupTitleLengthRule(16);
  const item = newBatchedPlacementGroup("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementGroupVersionRangeRule flags values above version", () => {
  const rule = new BatchedPlacementGroupVersionRangeRule(1000, 3600);
  const item = newBatchedPlacementGroup("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPlacementGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedPlacementGroupRequiredLocaleRule("batched placement group needs an entry");
  const item = newBatchedPlacementGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPlacementGroupCodeLengthRule flags a long code", () => {
  const rule = new BatchedPlacementGroupCodeLengthRule(255);
  const item = newBatchedPlacementGroup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPlacementGroupNotesLengthRule flags a long notes", () => {
  const rule = new BatchedPlacementGroupNotesLengthRule(1000);
  const item = newBatchedPlacementGroup("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
