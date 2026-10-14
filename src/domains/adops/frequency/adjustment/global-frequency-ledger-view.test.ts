import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalFrequencyLedgerView, toGlobalFrequencyLedgerViews } from "./global-frequency-ledger-view.js";
import { newGlobalFrequencyLedger } from "./global-frequency-ledger.js";

test("GlobalFrequencyLedgerView shows the status in capitals", () => {
  const item = newGlobalFrequencyLedger("code-751", "title-205");
  const view = toGlobalFrequencyLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalFrequencyLedgerViews([item, item]).length, 2, "views");
});
