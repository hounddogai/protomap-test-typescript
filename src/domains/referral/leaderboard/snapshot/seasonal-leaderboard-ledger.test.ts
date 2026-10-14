import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLeaderboardLedger } from "./seasonal-leaderboard-ledger.js";

test("SeasonalLeaderboardLedger starts in new", () => {
  const item = newSeasonalLeaderboardLedger("code-833", "title-139");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLeaderboardLedger moves to queued", () => {
  const item = newSeasonalLeaderboardLedger("code-833", "title-139");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalLeaderboardLedger rejects moves from failed", () => {
  const item = newSeasonalLeaderboardLedger("code-833", "title-139");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
