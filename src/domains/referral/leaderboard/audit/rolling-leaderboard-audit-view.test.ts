import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingLeaderboardAuditView, toRollingLeaderboardAuditViews } from "./rolling-leaderboard-audit-view.js";
import { newRollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

test("RollingLeaderboardAuditView shows the status in capitals", () => {
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  const view = toRollingLeaderboardAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingLeaderboardAuditViews([item, item]).length, 2, "views");
});
