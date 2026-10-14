import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCreativeLedgerView, toSeasonalCreativeLedgerViews } from "./seasonal-creative-ledger-view.js";
import { newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("SeasonalCreativeLedgerView shows the status in capitals", () => {
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  const view = toSeasonalCreativeLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCreativeLedgerViews([item, item]).length, 2, "views");
});
