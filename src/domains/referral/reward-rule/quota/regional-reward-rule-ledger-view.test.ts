import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalRewardRuleLedgerView,
  toRegionalRewardRuleLedgerViews,
} from "./regional-reward-rule-ledger-view.js";
import { newRegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

test("RegionalRewardRuleLedgerView shows the status in capitals", () => {
  const item = newRegionalRewardRuleLedger("code-188", "label-916");
  const view = toRegionalRewardRuleLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRewardRuleLedgerViews([item, item]).length, 2, "views");
});
