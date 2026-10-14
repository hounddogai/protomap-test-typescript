import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingSenderQuotaView, toRollingSenderQuotaViews } from "./rolling-sender-quota-view.js";
import { newRollingSenderQuota } from "./rolling-sender-quota.js";

test("RollingSenderQuotaView shows the status in capitals", () => {
  const item = newRollingSenderQuota("code-411", "name-934");
  const view = toRollingSenderQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSenderQuotaViews([item, item]).length, 2, "views");
});
