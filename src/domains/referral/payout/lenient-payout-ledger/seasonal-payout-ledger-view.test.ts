import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPayoutLedgerView, toSeasonalPayoutLedgerViews } from "./seasonal-payout-ledger-view.js";
import { newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("SeasonalPayoutLedgerView shows the status in capitals", () => {
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  const view = toSeasonalPayoutLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPayoutLedgerViews([item, item]).length, 2, "views");
});
