import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceQuotaView, toBounceQuotaViews } from "./bounce-quota-view.js";
import { newBounceQuota } from "./bounce-quota.js";

test("BounceQuotaView shows the status in capitals", () => {
  const item = newBounceQuota("code-565", "title-737");
  const view = toBounceQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceQuotaViews([item, item]).length, 2, "views");
});
