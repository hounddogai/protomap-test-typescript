import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredLeaderboardAuditView, toTieredLeaderboardAuditViews } from "./tiered-leaderboard-audit-view.js";
import { newTieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

test("TieredLeaderboardAuditView shows the status in capitals", () => {
  const item = newTieredLeaderboardAudit("code-938", "name-220");
  const view = toTieredLeaderboardAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredLeaderboardAuditViews([item, item]).length, 2, "views");
});
