import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditRecord } from "./batched-credit-record.js";

test("BatchedCreditRecord starts in draft", () => {
  const item = newBatchedCreditRecord("code-54", "title-699");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditRecord moves to suspended", () => {
  const item = newBatchedCreditRecord("code-54", "title-699");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BatchedCreditRecord rejects moves from closed", () => {
  const item = newBatchedCreditRecord("code-54", "title-699");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
