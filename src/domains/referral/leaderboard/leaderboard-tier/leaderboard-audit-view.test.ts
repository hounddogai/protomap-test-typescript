import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardAuditView, toLeaderboardAuditViews } from "./leaderboard-audit-view.js";
import { newLeaderboardAudit } from "./leaderboard-audit.js";

test("LeaderboardAuditView shows the status in capitals", () => {
  const item = newLeaderboardAudit("code-470", "title-440");
  const view = toLeaderboardAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardAuditViews([item, item]).length, 2, "views");
});
