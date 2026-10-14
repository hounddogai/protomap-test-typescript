import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBounceQuotaView, toFallbackBounceQuotaViews } from "./fallback-bounce-quota-view.js";
import { newFallbackBounceQuota } from "./fallback-bounce-quota.js";

test("FallbackBounceQuotaView shows the status in capitals", () => {
  const item = newFallbackBounceQuota("code-702", "title-310");
  const view = toFallbackBounceQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBounceQuotaViews([item, item]).length, 2, "views");
});
