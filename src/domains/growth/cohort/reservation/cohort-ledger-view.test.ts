import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortLedgerView, toCohortLedgerViews } from "./cohort-ledger-view.js";
import { newCohortLedger } from "./cohort-ledger.js";

test("CohortLedgerView shows the status in capitals", () => {
  const item = newCohortLedger("code-261", "name-879");
  const view = toCohortLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortLedgerViews([item, item]).length, 2, "views");
});
