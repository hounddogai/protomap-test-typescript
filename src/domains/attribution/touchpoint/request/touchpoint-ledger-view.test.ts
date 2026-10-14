import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointLedgerView, toTouchpointLedgerViews } from "./touchpoint-ledger-view.js";
import { newTouchpointLedger } from "./touchpoint-ledger.js";

test("TouchpointLedgerView shows the status in capitals", () => {
  const item = newTouchpointLedger("code-752", "title-876");
  const view = toTouchpointLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointLedgerViews([item, item]).length, 2, "views");
});
