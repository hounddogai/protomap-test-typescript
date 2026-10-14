import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditRequest } from "./batched-credit-request.js";

test("BatchedCreditRequest starts in new", () => {
  const item = newBatchedCreditRequest("code-848", "name-86");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditRequest moves to running", () => {
  const item = newBatchedCreditRequest("code-848", "name-86");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedCreditRequest rejects moves from failed", () => {
  const item = newBatchedCreditRequest("code-848", "name-86");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
