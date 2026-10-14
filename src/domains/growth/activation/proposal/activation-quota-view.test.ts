import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationQuotaView, toActivationQuotaViews } from "./activation-quota-view.js";
import { newActivationQuota } from "./activation-quota.js";

test("ActivationQuotaView shows the status in capitals", () => {
  const item = newActivationQuota("code-74", "label-809");
  const view = toActivationQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationQuotaViews([item, item]).length, 2, "views");
});
