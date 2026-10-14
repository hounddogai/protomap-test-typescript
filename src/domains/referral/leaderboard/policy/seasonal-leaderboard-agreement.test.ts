import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

test("SeasonalLeaderboardAgreement starts in open", () => {
  const item = newSeasonalLeaderboardAgreement("code-930", "name-84");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLeaderboardAgreement moves to in review", () => {
  const item = newSeasonalLeaderboardAgreement("code-930", "name-84");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SeasonalLeaderboardAgreement rejects moves from archived", () => {
  const item = newSeasonalLeaderboardAgreement("code-930", "name-84");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
