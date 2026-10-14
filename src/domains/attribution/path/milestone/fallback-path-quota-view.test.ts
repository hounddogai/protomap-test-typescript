import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPathQuotaView, toFallbackPathQuotaViews } from "./fallback-path-quota-view.js";
import { newFallbackPathQuota } from "./fallback-path-quota.js";

test("FallbackPathQuotaView shows the status in capitals", () => {
  const item = newFallbackPathQuota("code-605", "label-177");
  const view = toFallbackPathQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPathQuotaViews([item, item]).length, 2, "views");
});
