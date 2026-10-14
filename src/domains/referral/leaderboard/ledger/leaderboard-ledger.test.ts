import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardLedger } from "./leaderboard-ledger.js";

test("LeaderboardLedger starts in requested", () => {
  const item = newLeaderboardLedger("code-868", "name-55");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardLedger moves to revoked", () => {
  const item = newLeaderboardLedger("code-868", "name-55");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LeaderboardLedger rejects moves from expired", () => {
  const item = newLeaderboardLedger("code-868", "name-55");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
