import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCohortLedgerView, toTieredCohortLedgerViews } from "./tiered-cohort-ledger-view.js";
import { newTieredCohortLedger } from "./tiered-cohort-ledger.js";

test("TieredCohortLedgerView shows the status in capitals", () => {
  const item = newTieredCohortLedger("code-69", "name-796");
  const view = toTieredCohortLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCohortLedgerViews([item, item]).length, 2, "views");
});
