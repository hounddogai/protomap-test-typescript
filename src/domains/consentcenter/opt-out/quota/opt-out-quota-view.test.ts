import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutQuotaView, toOptOutQuotaViews } from "./opt-out-quota-view.js";
import { newOptOutQuota } from "./opt-out-quota.js";

test("OptOutQuotaView shows the status in capitals", () => {
  const item = newOptOutQuota("code-605", "title-309");
  const view = toOptOutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutQuotaViews([item, item]).length, 2, "views");
});
