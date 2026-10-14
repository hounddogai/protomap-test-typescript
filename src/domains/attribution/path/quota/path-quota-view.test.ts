import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathQuotaView, toPathQuotaViews } from "./path-quota-view.js";
import { newPathQuota } from "./path-quota.js";

test("PathQuotaView shows the status in capitals", () => {
  const item = newPathQuota("code-653", "label-840");
  const view = toPathQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathQuotaViews([item, item]).length, 2, "views");
});
