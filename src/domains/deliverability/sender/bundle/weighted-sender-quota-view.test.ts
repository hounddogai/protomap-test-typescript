import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedSenderQuotaView, toWeightedSenderQuotaViews } from "./weighted-sender-quota-view.js";
import { newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("WeightedSenderQuotaView shows the status in capitals", () => {
  const item = newWeightedSenderQuota("code-297", "title-506");
  const view = toWeightedSenderQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedSenderQuotaViews([item, item]).length, 2, "views");
});
