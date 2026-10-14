import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightLedgerView, toFlightLedgerViews } from "./flight-ledger-view.js";
import { newFlightLedger } from "./flight-ledger.js";

test("FlightLedgerView shows the status in capitals", () => {
  const item = newFlightLedger("code-292", "title-685");
  const view = toFlightLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightLedgerViews([item, item]).length, 2, "views");
});
