import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalStreakQuotaView, toSeasonalStreakQuotaViews } from "./seasonal-streak-quota-view.js";
import { newSeasonalStreakQuota } from "./seasonal-streak-quota.js";

test("SeasonalStreakQuotaView shows the status in capitals", () => {
  const item = newSeasonalStreakQuota("code-14", "label-190");
  const view = toSeasonalStreakQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalStreakQuotaViews([item, item]).length, 2, "views");
});
