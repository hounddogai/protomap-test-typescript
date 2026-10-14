import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionLedgerView, toConversionLedgerViews } from "./conversion-ledger-view.js";
import { newConversionLedger } from "./conversion-ledger.js";

test("ConversionLedgerView shows the status in capitals", () => {
  const item = newConversionLedger("code-53", "name-587");
  const view = toConversionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionLedgerViews([item, item]).length, 2, "views");
});
