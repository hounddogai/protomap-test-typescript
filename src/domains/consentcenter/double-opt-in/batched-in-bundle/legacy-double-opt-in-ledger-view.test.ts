import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyDoubleOptInLedgerView, toLegacyDoubleOptInLedgerViews } from "./legacy-double-opt-in-ledger-view.js";
import { newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

test("LegacyDoubleOptInLedgerView shows the status in capitals", () => {
  const item = newLegacyDoubleOptInLedger("code-689", "title-674");
  const view = toLegacyDoubleOptInLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDoubleOptInLedgerViews([item, item]).length, 2, "views");
});
