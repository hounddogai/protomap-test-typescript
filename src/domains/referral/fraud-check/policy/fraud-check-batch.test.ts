import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckBatch } from "./fraud-check-batch.js";

test("FraudCheckBatch starts in open", () => {
  const item = newFraudCheckBatch("code-587", "label-305");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckBatch moves to resolved", () => {
  const item = newFraudCheckBatch("code-587", "label-305");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FraudCheckBatch rejects moves from archived", () => {
  const item = newFraudCheckBatch("code-587", "label-305");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
