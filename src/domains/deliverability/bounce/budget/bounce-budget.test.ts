import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceBudget } from "./bounce-budget.js";

test("BounceBudget starts in new", () => {
  const item = newBounceBudget("code-489", "name-668");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceBudget moves to done", () => {
  const item = newBounceBudget("code-489", "name-668");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BounceBudget rejects moves from failed", () => {
  const item = newBounceBudget("code-489", "name-668");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
