import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBounceBudget } from "./capped-bounce-budget.js";

test("CappedBounceBudget starts in proposed", () => {
  const item = newCappedBounceBudget("code-589", "name-946");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBounceBudget moves to approved", () => {
  const item = newCappedBounceBudget("code-589", "name-946");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedBounceBudget rejects moves from withdrawn", () => {
  const item = newCappedBounceBudget("code-589", "name-946");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
