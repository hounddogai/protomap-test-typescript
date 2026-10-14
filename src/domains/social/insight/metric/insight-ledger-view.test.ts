import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightLedgerView, toInsightLedgerViews } from "./insight-ledger-view.js";
import { newInsightLedger } from "./insight-ledger.js";

test("InsightLedgerView shows the status in capitals", () => {
  const item = newInsightLedger("code-961", "title-167");
  const view = toInsightLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightLedgerViews([item, item]).length, 2, "views");
});
