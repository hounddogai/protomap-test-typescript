import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationLedgerView, toReputationLedgerViews } from "./reputation-ledger-view.js";
import { newReputationLedger } from "./reputation-ledger.js";

test("ReputationLedgerView shows the status in capitals", () => {
  const item = newReputationLedger("code-288", "label-869");
  const view = toReputationLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationLedgerViews([item, item]).length, 2, "views");
});
