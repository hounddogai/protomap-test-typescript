import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalMentionLedgerView, toSeasonalMentionLedgerViews } from "./seasonal-mention-ledger-view.js";
import { newSeasonalMentionLedger } from "./seasonal-mention-ledger.js";

test("SeasonalMentionLedgerView shows the status in capitals", () => {
  const item = newSeasonalMentionLedger("code-232", "label-112");
  const view = toSeasonalMentionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalMentionLedgerViews([item, item]).length, 2, "views");
});
