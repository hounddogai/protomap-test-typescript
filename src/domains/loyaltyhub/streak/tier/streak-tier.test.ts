import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakTier } from "./streak-tier.js";

test("StreakTier starts in proposed", () => {
  const item = newStreakTier("code-534", "title-824");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakTier moves to withdrawn", () => {
  const item = newStreakTier("code-534", "title-824");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StreakTier rejects moves from withdrawn", () => {
  const item = newStreakTier("code-534", "title-824");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
