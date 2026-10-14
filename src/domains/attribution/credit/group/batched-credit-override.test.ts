import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreditOverride } from "./batched-credit-override.js";

test("BatchedCreditOverride starts in draft", () => {
  const item = newBatchedCreditOverride("code-12", "label-254");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreditOverride moves to closed", () => {
  const item = newBatchedCreditOverride("code-12", "label-254");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("BatchedCreditOverride rejects moves from closed", () => {
  const item = newBatchedCreditOverride("code-12", "label-254");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
