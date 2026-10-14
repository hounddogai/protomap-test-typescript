import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyLeaderboardQuotaView, toLegacyLeaderboardQuotaViews } from "./legacy-leaderboard-quota-view.js";
import { newLegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

test("LegacyLeaderboardQuotaView shows the status in capitals", () => {
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  const view = toLegacyLeaderboardQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyLeaderboardQuotaViews([item, item]).length, 2, "views");
});
