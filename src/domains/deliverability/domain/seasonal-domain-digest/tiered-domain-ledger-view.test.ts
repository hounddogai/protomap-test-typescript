import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredDomainLedgerView, toTieredDomainLedgerViews } from "./tiered-domain-ledger-view.js";
import { newTieredDomainLedger } from "./tiered-domain-ledger.js";

test("TieredDomainLedgerView shows the status in capitals", () => {
  const item = newTieredDomainLedger("code-979", "name-260");
  const view = toTieredDomainLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDomainLedgerViews([item, item]).length, 2, "views");
});
