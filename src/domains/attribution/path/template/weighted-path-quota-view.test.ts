import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedPathQuotaView, toWeightedPathQuotaViews } from "./weighted-path-quota-view.js";
import { newWeightedPathQuota } from "./weighted-path-quota.js";

test("WeightedPathQuotaView shows the status in capitals", () => {
  const item = newWeightedPathQuota("code-123", "title-328");
  const view = toWeightedPathQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPathQuotaViews([item, item]).length, 2, "views");
});
