import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryInsightLedgerView, toPrimaryInsightLedgerViews } from "./primary-insight-ledger-view.js";
import { newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("PrimaryInsightLedgerView shows the status in capitals", () => {
  const item = newPrimaryInsightLedger("code-448", "name-551");
  const view = toPrimaryInsightLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInsightLedgerViews([item, item]).length, 2, "views");
});
