import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreativeBudget } from "./strict-creative-budget.js";

test("StrictCreativeBudget starts in open", () => {
  const item = newStrictCreativeBudget("code-536", "label-558");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreativeBudget moves to in review", () => {
  const item = newStrictCreativeBudget("code-536", "label-558");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictCreativeBudget rejects moves from archived", () => {
  const item = newStrictCreativeBudget("code-536", "label-558");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
