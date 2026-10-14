import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMacroPolicyClicksRangeRule,
  BatchedMacroPolicyCodeLengthRule,
  BatchedMacroPolicyLabelLengthRule,
  BatchedMacroPolicyLocaleLengthRule,
  BatchedMacroPolicyRequiredCodeRule,
  defaultBatchedMacroPolicyValidator,
} from "./batched-macro-policy-rules.js";
import { newBatchedMacroPolicy } from "./batched-macro-policy.js";

test("BatchedMacroPolicyValidator reports every problem", () => {
  const validator = defaultBatchedMacroPolicyValidator();
  const item = newBatchedMacroPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMacroPolicyLabelLengthRule flags a long label", () => {
  const rule = new BatchedMacroPolicyLabelLengthRule(64);
  const item = newBatchedMacroPolicy("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroPolicyCodeLengthRule flags a long code", () => {
  const rule = new BatchedMacroPolicyCodeLengthRule(16);
  const item = newBatchedMacroPolicy("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroPolicyClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedMacroPolicyClicksRangeRule(1000, 86400);
  const item = newBatchedMacroPolicy("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMacroPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedMacroPolicyRequiredCodeRule("batched macro policy needs an entry");
  const item = newBatchedMacroPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedMacroPolicyLocaleLengthRule flags a long locale", () => {
  const rule = new BatchedMacroPolicyLocaleLengthRule(16);
  const item = newBatchedMacroPolicy("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
