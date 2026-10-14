import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBadgeQuotaView, toManualBadgeQuotaViews } from "./manual-badge-quota-view.js";
import { newManualBadgeQuota } from "./manual-badge-quota.js";

test("ManualBadgeQuotaView shows the status in capitals", () => {
  const item = newManualBadgeQuota("code-470", "title-224");
  const view = toManualBadgeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBadgeQuotaViews([item, item]).length, 2, "views");
});
