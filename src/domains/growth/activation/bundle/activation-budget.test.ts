import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationBudget } from "./activation-budget.js";

test("ActivationBudget starts in created", () => {
  const item = newActivationBudget("code-77", "title-310");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationBudget moves to published", () => {
  const item = newActivationBudget("code-77", "title-310");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ActivationBudget rejects moves from retired", () => {
  const item = newActivationBudget("code-77", "title-310");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
