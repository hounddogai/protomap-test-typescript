import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementBudget } from "./placement-budget.js";

test("PlacementBudget starts in requested", () => {
  const item = newPlacementBudget("code-12", "title-266");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementBudget moves to expired", () => {
  const item = newPlacementBudget("code-12", "title-266");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PlacementBudget rejects moves from expired", () => {
  const item = newPlacementBudget("code-12", "title-266");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
