import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

test("SeasonalBadgeBudget starts in proposed", () => {
  const item = newSeasonalBadgeBudget("code-612", "label-702");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBadgeBudget moves to rejected", () => {
  const item = newSeasonalBadgeBudget("code-612", "label-702");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalBadgeBudget rejects moves from withdrawn", () => {
  const item = newSeasonalBadgeBudget("code-612", "label-702");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
