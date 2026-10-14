import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalBidRuleLedgerView, toRegionalBidRuleLedgerViews } from "./regional-bid-rule-ledger-view.js";
import { newRegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

test("RegionalBidRuleLedgerView shows the status in capitals", () => {
  const item = newRegionalBidRuleLedger("code-913", "label-253");
  const view = toRegionalBidRuleLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalBidRuleLedgerViews([item, item]).length, 2, "views");
});
