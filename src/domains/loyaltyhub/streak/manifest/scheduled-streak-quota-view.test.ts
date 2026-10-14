import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledStreakQuotaView, toScheduledStreakQuotaViews } from "./scheduled-streak-quota-view.js";
import { newScheduledStreakQuota } from "./scheduled-streak-quota.js";

test("ScheduledStreakQuotaView shows the status in capitals", () => {
  const item = newScheduledStreakQuota("code-785", "title-351");
  const view = toScheduledStreakQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledStreakQuotaViews([item, item]).length, 2, "views");
});
