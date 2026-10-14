import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleLedgerView, toBidRuleLedgerViews } from "./bid-rule-ledger-view.js";
import { newBidRuleLedger } from "./bid-rule-ledger.js";

test("BidRuleLedgerView shows the status in capitals", () => {
  const item = newBidRuleLedger("code-295", "label-281");
  const view = toBidRuleLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleLedgerViews([item, item]).length, 2, "views");
});
