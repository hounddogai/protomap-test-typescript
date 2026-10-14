import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalMentionLedgerStore } from "./seasonal-mention-ledger-store.js";
import { newSeasonalMentionLedger } from "./seasonal-mention-ledger.js";

test("MemorySeasonalMentionLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalMentionLedgerStore();
  const item = newSeasonalMentionLedger("code-232", "label-112");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
