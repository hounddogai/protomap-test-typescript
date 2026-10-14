import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLeaderboardLedgerStore } from "./seasonal-leaderboard-ledger-store.js";
import { newSeasonalLeaderboardLedger } from "./seasonal-leaderboard-ledger.js";

test("MemorySeasonalLeaderboardLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalLeaderboardLedgerStore();
  const item = newSeasonalLeaderboardLedger("code-833", "title-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
