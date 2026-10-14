import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPlacementLedgerView, toRollingPlacementLedgerViews } from "./rolling-placement-ledger-view.js";
import { newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("RollingPlacementLedgerView shows the status in capitals", () => {
  const item = newRollingPlacementLedger("code-443", "name-485");
  const view = toRollingPlacementLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPlacementLedgerViews([item, item]).length, 2, "views");
});
