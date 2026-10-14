import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardLedgerStore } from "./leaderboard-ledger-store.js";
import { newLeaderboardLedger } from "./leaderboard-ledger.js";

test("MemoryLeaderboardLedgerStore finds what it saved", () => {
  const store = newMemoryLeaderboardLedgerStore();
  const item = newLeaderboardLedger("code-868", "name-55");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
