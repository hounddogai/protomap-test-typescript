import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFrequencyLedgerView, toLenientFrequencyLedgerViews } from "./lenient-frequency-ledger-view.js";
import { newLenientFrequencyLedger } from "./lenient-frequency-ledger.js";

test("LenientFrequencyLedgerView shows the status in capitals", () => {
  const item = newLenientFrequencyLedger("code-24", "name-314");
  const view = toLenientFrequencyLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFrequencyLedgerViews([item, item]).length, 2, "views");
});
