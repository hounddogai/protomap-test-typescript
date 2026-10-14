import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWaitBudget } from "./strict-wait-budget.js";

test("StrictWaitBudget starts in created", () => {
  const item = newStrictWaitBudget("code-342", "title-98");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWaitBudget moves to published", () => {
  const item = newStrictWaitBudget("code-342", "title-98");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("StrictWaitBudget rejects moves from retired", () => {
  const item = newStrictWaitBudget("code-342", "title-98");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
