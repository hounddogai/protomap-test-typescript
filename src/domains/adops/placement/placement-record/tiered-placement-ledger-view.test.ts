import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPlacementLedgerView, toTieredPlacementLedgerViews } from "./tiered-placement-ledger-view.js";
import { newTieredPlacementLedger } from "./tiered-placement-ledger.js";

test("TieredPlacementLedgerView shows the status in capitals", () => {
  const item = newTieredPlacementLedger("code-510", "label-281");
  const view = toTieredPlacementLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPlacementLedgerViews([item, item]).length, 2, "views");
});
