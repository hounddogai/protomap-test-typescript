import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledTierLedgerView, toScheduledTierLedgerViews } from "./scheduled-tier-ledger-view.js";
import { newScheduledTierLedger } from "./scheduled-tier-ledger.js";

test("ScheduledTierLedgerView shows the status in capitals", () => {
  const item = newScheduledTierLedger("code-749", "name-250");
  const view = toScheduledTierLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledTierLedgerViews([item, item]).length, 2, "views");
});
