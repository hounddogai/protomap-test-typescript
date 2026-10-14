import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyLedgerView, toJourneyLedgerViews } from "./journey-ledger-view.js";
import { newJourneyLedger } from "./journey-ledger.js";

test("JourneyLedgerView shows the status in capitals", () => {
  const item = newJourneyLedger("code-41", "title-356");
  const view = toJourneyLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyLedgerViews([item, item]).length, 2, "views");
});
