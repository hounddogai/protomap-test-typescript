import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLeaderboardQuotaStore } from "./manual-leaderboard-quota-store.js";
import { newManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

test("MemoryManualLeaderboardQuotaStore finds what it saved", () => {
  const store = newMemoryManualLeaderboardQuotaStore();
  const item = newManualLeaderboardQuota("code-520", "name-368");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
