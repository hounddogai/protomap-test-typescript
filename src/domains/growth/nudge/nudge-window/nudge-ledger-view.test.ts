import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeLedgerView, toNudgeLedgerViews } from "./nudge-ledger-view.js";
import { newNudgeLedger } from "./nudge-ledger.js";

test("NudgeLedgerView shows the status in capitals", () => {
  const item = newNudgeLedger("code-738", "title-46");
  const view = toNudgeLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeLedgerViews([item, item]).length, 2, "views");
});
