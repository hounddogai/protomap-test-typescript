import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientComplaintLedgerView, toLenientComplaintLedgerViews } from "./lenient-complaint-ledger-view.js";
import { newLenientComplaintLedger } from "./lenient-complaint-ledger.js";

test("LenientComplaintLedgerView shows the status in capitals", () => {
  const item = newLenientComplaintLedger("code-895", "name-21");
  const view = toLenientComplaintLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientComplaintLedgerViews([item, item]).length, 2, "views");
});
