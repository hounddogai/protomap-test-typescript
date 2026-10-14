import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreativeBudget } from "./capped-creative-budget.js";

test("CappedCreativeBudget starts in idle", () => {
  const item = newCappedCreativeBudget("code-290", "title-462");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreativeBudget moves to warming", () => {
  const item = newCappedCreativeBudget("code-290", "title-462");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedCreativeBudget rejects moves from stopped", () => {
  const item = newCappedCreativeBudget("code-290", "title-462");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
