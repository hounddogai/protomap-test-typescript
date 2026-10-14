import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelBudget } from "./model-budget.js";

test("ModelBudget starts in new", () => {
  const item = newModelBudget("code-130", "title-1");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelBudget moves to done", () => {
  const item = newModelBudget("code-130", "title-1");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ModelBudget rejects moves from failed", () => {
  const item = newModelBudget("code-130", "title-1");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
