import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditBatch } from "./credit-batch.js";

test("CreditBatch starts in draft", () => {
  const item = newCreditBatch("code-868", "name-943");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditBatch moves to pending", () => {
  const item = newCreditBatch("code-868", "name-943");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CreditBatch rejects moves from closed", () => {
  const item = newCreditBatch("code-868", "name-943");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
