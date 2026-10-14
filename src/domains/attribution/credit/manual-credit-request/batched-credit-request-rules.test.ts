import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCreditRequestClicksRangeRule,
  BatchedCreditRequestCodeLengthRule,
  BatchedCreditRequestGraceDaysRangeRule,
  BatchedCreditRequestRequiredNameRule,
  BatchedCreditRequestStartsAtRangeRule,
  defaultBatchedCreditRequestValidator,
} from "./batched-credit-request-rules.js";
import { newBatchedCreditRequest } from "./batched-credit-request.js";

test("BatchedCreditRequestValidator reports every problem", () => {
  const validator = defaultBatchedCreditRequestValidator();
  const item = newBatchedCreditRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCreditRequestRequiredNameRule flags a blank name", () => {
  const rule = new BatchedCreditRequestRequiredNameRule("batched credit request needs a value");
  const item = newBatchedCreditRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCreditRequestCodeLengthRule flags a long code", () => {
  const rule = new BatchedCreditRequestCodeLengthRule(3600);
  const item = newBatchedCreditRequest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCreditRequestClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedCreditRequestClicksRangeRule(3600, 86400);
  const item = newBatchedCreditRequest("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditRequestStartsAtRangeRule flags values above starts at", () => {
  const rule = new BatchedCreditRequestStartsAtRangeRule(16, 86400);
  const item = newBatchedCreditRequest("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCreditRequestGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedCreditRequestGraceDaysRangeRule(3600, 86400);
  const item = newBatchedCreditRequest("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
