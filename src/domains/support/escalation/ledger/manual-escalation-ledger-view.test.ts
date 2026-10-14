import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualEscalationLedgerView, toManualEscalationLedgerViews } from "./manual-escalation-ledger-view.js";
import { newManualEscalationLedger } from "./manual-escalation-ledger.js";

test("ManualEscalationLedgerView shows the status in capitals", () => {
  const item = newManualEscalationLedger("code-913", "label-174");
  const view = toManualEscalationLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualEscalationLedgerViews([item, item]).length, 2, "views");
});
