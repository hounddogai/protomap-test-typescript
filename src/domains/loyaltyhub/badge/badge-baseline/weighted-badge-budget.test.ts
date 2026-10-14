import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBadgeBudget } from "./weighted-badge-budget.js";

test("WeightedBadgeBudget starts in created", () => {
  const item = newWeightedBadgeBudget("code-656", "title-376");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBadgeBudget moves to published", () => {
  const item = newWeightedBadgeBudget("code-656", "title-376");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedBadgeBudget rejects moves from retired", () => {
  const item = newWeightedBadgeBudget("code-656", "title-376");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
