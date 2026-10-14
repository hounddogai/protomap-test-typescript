import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLeaderboardBudget } from "./fallback-leaderboard-budget.js";

test("FallbackLeaderboardBudget starts in open", () => {
  const item = newFallbackLeaderboardBudget("code-483", "name-773");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLeaderboardBudget moves to archived", () => {
  const item = newFallbackLeaderboardBudget("code-483", "name-773");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackLeaderboardBudget rejects moves from archived", () => {
  const item = newFallbackLeaderboardBudget("code-483", "name-773");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
