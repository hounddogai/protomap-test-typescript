import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionLedgerView, toMentionLedgerViews } from "./mention-ledger-view.js";
import { newMentionLedger } from "./mention-ledger.js";

test("MentionLedgerView shows the status in capitals", () => {
  const item = newMentionLedger("code-743", "name-566");
  const view = toMentionLedgerView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionLedgerViews([item, item]).length, 2, "views");
});
