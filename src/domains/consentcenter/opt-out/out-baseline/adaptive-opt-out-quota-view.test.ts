import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveOptOutQuotaView, toAdaptiveOptOutQuotaViews } from "./adaptive-opt-out-quota-view.js";
import { newAdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

test("AdaptiveOptOutQuotaView shows the status in capitals", () => {
  const item = newAdaptiveOptOutQuota("code-91", "label-964");
  const view = toAdaptiveOptOutQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveOptOutQuotaViews([item, item]).length, 2, "views");
});
