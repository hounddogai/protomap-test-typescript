import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLevelBudget } from "./strict-level-budget.js";

test("StrictLevelBudget starts in requested", () => {
  const item = newStrictLevelBudget("code-497", "label-149");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLevelBudget moves to granted", () => {
  const item = newStrictLevelBudget("code-497", "label-149");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictLevelBudget rejects moves from expired", () => {
  const item = newStrictLevelBudget("code-497", "label-149");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
