import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

test("SeasonalChallengeAllocation starts in open", () => {
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalChallengeAllocation moves to resolved", () => {
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("SeasonalChallengeAllocation rejects moves from archived", () => {
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
