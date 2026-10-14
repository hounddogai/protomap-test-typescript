import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPostBudget } from "./manual-post-budget.js";

test("ManualPostBudget starts in created", () => {
  const item = newManualPostBudget("code-943", "name-189");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPostBudget moves to published", () => {
  const item = newManualPostBudget("code-943", "name-189");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualPostBudget rejects moves from retired", () => {
  const item = newManualPostBudget("code-943", "name-189");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
