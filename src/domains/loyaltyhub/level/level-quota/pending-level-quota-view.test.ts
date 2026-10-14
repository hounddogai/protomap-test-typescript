import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingLevelQuotaView, toPendingLevelQuotaViews } from "./pending-level-quota-view.js";
import { newPendingLevelQuota } from "./pending-level-quota.js";

test("PendingLevelQuotaView shows the status in capitals", () => {
  const item = newPendingLevelQuota("code-630", "label-79");
  const view = toPendingLevelQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingLevelQuotaViews([item, item]).length, 2, "views");
});
