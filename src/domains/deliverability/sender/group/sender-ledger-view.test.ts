import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderLedgerView, toSenderLedgerViews } from "./sender-ledger-view.js";
import { newSenderLedger } from "./sender-ledger.js";

test("SenderLedgerView shows the status in capitals", () => {
  const item = newSenderLedger("code-851", "label-478");
  const view = toSenderLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderLedgerViews([item, item]).length, 2, "views");
});
