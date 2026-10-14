import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCreativeQuotaView, toAdaptiveCreativeQuotaViews } from "./adaptive-creative-quota-view.js";
import { newAdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

test("AdaptiveCreativeQuotaView shows the status in capitals", () => {
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  const view = toAdaptiveCreativeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreativeQuotaViews([item, item]).length, 2, "views");
});
