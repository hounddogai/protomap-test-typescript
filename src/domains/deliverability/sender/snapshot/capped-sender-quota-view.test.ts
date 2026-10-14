import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSenderQuotaView, toCappedSenderQuotaViews } from "./capped-sender-quota-view.js";
import { newCappedSenderQuota } from "./capped-sender-quota.js";

test("CappedSenderQuotaView shows the status in capitals", () => {
  const item = newCappedSenderQuota("code-761", "title-857");
  const view = toCappedSenderQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSenderQuotaViews([item, item]).length, 2, "views");
});
