import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFlightLedgerView, toDefaultFlightLedgerViews } from "./default-flight-ledger-view.js";
import { newDefaultFlightLedger } from "./default-flight-ledger.js";

test("DefaultFlightLedgerView shows the status in capitals", () => {
  const item = newDefaultFlightLedger("code-900", "label-50");
  const view = toDefaultFlightLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFlightLedgerViews([item, item]).length, 2, "views");
});
