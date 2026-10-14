import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditRule } from "./batched-credit-rule.js";

test("BatchedCreditRule starts in planned", () => {
  const item = newBatchedCreditRule("code-833", "title-557");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditRule moves to completed", () => {
  const item = newBatchedCreditRule("code-833", "title-557");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BatchedCreditRule rejects moves from cancelled", () => {
  const item = newBatchedCreditRule("code-833", "title-557");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
