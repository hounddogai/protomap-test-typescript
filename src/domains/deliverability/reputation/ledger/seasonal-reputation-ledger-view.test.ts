import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalReputationLedgerView,
  toSeasonalReputationLedgerViews,
} from "./seasonal-reputation-ledger-view.js";
import { newSeasonalReputationLedger } from "./seasonal-reputation-ledger.js";

test("SeasonalReputationLedgerView shows the status in capitals", () => {
  const item = newSeasonalReputationLedger("code-675", "label-598");
  const view = toSeasonalReputationLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalReputationLedgerViews([item, item]).length, 2, "views");
});
