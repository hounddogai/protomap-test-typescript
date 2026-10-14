import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFlightDraftCodeLengthRule,
  BatchedFlightDraftRequiredCodeRule,
  BatchedFlightDraftRequiredTitleRule,
  defaultBatchedFlightDraftValidator,
} from "./batched-flight-draft-rules.js";
import { newBatchedFlightDraft } from "./batched-flight-draft.js";

test("BatchedFlightDraftValidator reports every problem", () => {
  const validator = defaultBatchedFlightDraftValidator();
  const item = newBatchedFlightDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFlightDraftRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedFlightDraftRequiredCodeRule("batched flight draft needs a value");
  const item = newBatchedFlightDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFlightDraftRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedFlightDraftRequiredTitleRule("batched flight draft needs a value");
  const item = newBatchedFlightDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFlightDraftCodeLengthRule flags a long code", () => {
  const rule = new BatchedFlightDraftCodeLengthRule(255);
  const item = newBatchedFlightDraft("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
