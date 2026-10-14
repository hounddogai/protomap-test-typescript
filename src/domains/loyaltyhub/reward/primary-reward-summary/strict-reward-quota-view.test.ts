import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictRewardQuotaView, toStrictRewardQuotaViews } from "./strict-reward-quota-view.js";
import { newStrictRewardQuota } from "./strict-reward-quota.js";

test("StrictRewardQuotaView shows the status in capitals", () => {
  const item = newStrictRewardQuota("code-198", "name-570");
  const view = toStrictRewardQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictRewardQuotaViews([item, item]).length, 2, "views");
});
