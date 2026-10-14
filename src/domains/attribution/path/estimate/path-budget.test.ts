import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathBudget } from "./path-budget.js";

test("PathBudget starts in created", () => {
  const item = newPathBudget("code-828", "title-402");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathBudget moves to retired", () => {
  const item = newPathBudget("code-828", "title-402");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PathBudget rejects moves from retired", () => {
  const item = newPathBudget("code-828", "title-402");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
