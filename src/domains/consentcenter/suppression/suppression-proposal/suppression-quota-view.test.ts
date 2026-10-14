import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionQuotaView, toSuppressionQuotaViews } from "./suppression-quota-view.js";
import { newSuppressionQuota } from "./suppression-quota.js";

test("SuppressionQuotaView shows the status in capitals", () => {
  const item = newSuppressionQuota("code-455", "label-188");
  const view = toSuppressionQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionQuotaViews([item, item]).length, 2, "views");
});
