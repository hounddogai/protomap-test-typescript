import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBounceQuotaView, toStrictBounceQuotaViews } from "./strict-bounce-quota-view.js";
import { newStrictBounceQuota } from "./strict-bounce-quota.js";

test("StrictBounceQuotaView shows the status in capitals", () => {
  const item = newStrictBounceQuota("code-950", "name-234");
  const view = toStrictBounceQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBounceQuotaViews([item, item]).length, 2, "views");
});
