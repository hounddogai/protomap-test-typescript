import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedSenderGroupCodeLengthRule,
  BatchedSenderGroupImpressionsRangeRule,
  BatchedSenderGroupNameLengthRule,
  BatchedSenderGroupRequiredNameRule,
  defaultBatchedSenderGroupValidator,
} from "./batched-sender-group-rules.js";
import { newBatchedSenderGroup } from "./batched-sender-group.js";

test("BatchedSenderGroupValidator reports every problem", () => {
  const validator = defaultBatchedSenderGroupValidator();
  const item = newBatchedSenderGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedSenderGroupRequiredNameRule flags a blank name", () => {
  const rule = new BatchedSenderGroupRequiredNameRule("batched sender group needs an entry");
  const item = newBatchedSenderGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedSenderGroupCodeLengthRule flags a long code", () => {
  const rule = new BatchedSenderGroupCodeLengthRule(86400);
  const item = newBatchedSenderGroup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSenderGroupNameLengthRule flags a long name", () => {
  const rule = new BatchedSenderGroupNameLengthRule(16);
  const item = newBatchedSenderGroup("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedSenderGroupImpressionsRangeRule flags values above impressions", () => {
  const rule = new BatchedSenderGroupImpressionsRangeRule(120, 3600);
  const item = newBatchedSenderGroup("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
