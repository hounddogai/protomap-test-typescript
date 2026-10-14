import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderQuotaView, toSenderQuotaViews } from "./sender-quota-view.js";
import { newSenderQuota } from "./sender-quota.js";

test("SenderQuotaView shows the status in capitals", () => {
  const item = newSenderQuota("code-289", "label-810");
  const view = toSenderQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderQuotaViews([item, item]).length, 2, "views");
});
