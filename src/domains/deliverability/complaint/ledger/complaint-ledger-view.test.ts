import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintLedgerView, toComplaintLedgerViews } from "./complaint-ledger-view.js";
import { newComplaintLedger } from "./complaint-ledger.js";

test("ComplaintLedgerView shows the status in capitals", () => {
  const item = newComplaintLedger("code-321", "title-685");
  const view = toComplaintLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintLedgerViews([item, item]).length, 2, "views");
});
