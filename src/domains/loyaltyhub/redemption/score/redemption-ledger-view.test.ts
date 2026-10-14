import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionLedgerView, toRedemptionLedgerViews } from "./redemption-ledger-view.js";
import { newRedemptionLedger } from "./redemption-ledger.js";

test("RedemptionLedgerView shows the status in capitals", () => {
  const item = newRedemptionLedger("code-989", "name-396");
  const view = toRedemptionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionLedgerViews([item, item]).length, 2, "views");
});
