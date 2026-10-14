import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCohortQuotaView, toTieredCohortQuotaViews } from "./tiered-cohort-quota-view.js";
import { newTieredCohortQuota } from "./tiered-cohort-quota.js";

test("TieredCohortQuotaView shows the status in capitals", () => {
  const item = newTieredCohortQuota("code-997", "title-277");
  const view = toTieredCohortQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCohortQuotaViews([item, item]).length, 2, "views");
});
