import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyEscalationLedgerView, toLegacyEscalationLedgerViews } from "./legacy-escalation-ledger-view.js";
import { newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("LegacyEscalationLedgerView shows the status in capitals", () => {
  const item = newLegacyEscalationLedger("code-334", "label-980");
  const view = toLegacyEscalationLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyEscalationLedgerViews([item, item]).length, 2, "views");
});
