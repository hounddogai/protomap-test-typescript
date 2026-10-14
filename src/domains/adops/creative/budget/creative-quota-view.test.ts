import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeQuotaView, toCreativeQuotaViews } from "./creative-quota-view.js";
import { newCreativeQuota } from "./creative-quota.js";

test("CreativeQuotaView shows the status in capitals", () => {
  const item = newCreativeQuota("code-780", "name-913");
  const view = toCreativeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeQuotaViews([item, item]).length, 2, "views");
});
