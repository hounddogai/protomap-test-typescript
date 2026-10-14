import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSlaQuotaView, toCappedSlaQuotaViews } from "./capped-sla-quota-view.js";
import { newCappedSlaQuota } from "./capped-sla-quota.js";

test("CappedSlaQuotaView shows the status in capitals", () => {
  const item = newCappedSlaQuota("code-196", "title-829");
  const view = toCappedSlaQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSlaQuotaViews([item, item]).length, 2, "views");
});
