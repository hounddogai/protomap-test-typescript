import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacySlaLedgerView, toLegacySlaLedgerViews } from "./legacy-sla-ledger-view.js";
import { newLegacySlaLedger } from "./legacy-sla-ledger.js";

test("LegacySlaLedgerView shows the status in capitals", () => {
  const item = newLegacySlaLedger("code-789", "name-547");
  const view = toLegacySlaLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacySlaLedgerViews([item, item]).length, 2, "views");
});
