import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackModelLedgerView, toFallbackModelLedgerViews } from "./fallback-model-ledger-view.js";
import { newFallbackModelLedger } from "./fallback-model-ledger.js";

test("FallbackModelLedgerView shows the status in capitals", () => {
  const item = newFallbackModelLedger("code-661", "name-896");
  const view = toFallbackModelLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackModelLedgerViews([item, item]).length, 2, "views");
});
