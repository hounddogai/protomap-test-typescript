import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyLeaderboardQuotaStore } from "./legacy-leaderboard-quota-store.js";
import { newLegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

test("MemoryLegacyLeaderboardQuotaStore finds what it saved", () => {
  const store = newMemoryLegacyLeaderboardQuotaStore();
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
