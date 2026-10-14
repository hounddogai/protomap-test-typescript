import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditLedger } from "./batched-credit-ledger.js";

test("BatchedCreditLedger starts in draft", () => {
  const item = newBatchedCreditLedger("code-135", "label-260");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditLedger moves to suspended", () => {
  const item = newBatchedCreditLedger("code-135", "label-260");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BatchedCreditLedger rejects moves from closed", () => {
  const item = newBatchedCreditLedger("code-135", "label-260");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
