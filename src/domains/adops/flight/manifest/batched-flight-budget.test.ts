import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFlightBudget } from "./batched-flight-budget.js";

test("BatchedFlightBudget starts in open", () => {
  const item = newBatchedFlightBudget("code-312", "name-345");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFlightBudget moves to in review", () => {
  const item = newBatchedFlightBudget("code-312", "name-345");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedFlightBudget rejects moves from archived", () => {
  const item = newBatchedFlightBudget("code-312", "name-345");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
