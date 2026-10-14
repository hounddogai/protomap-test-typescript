import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionLedgerStore } from "./mention-ledger-store.js";
import { newMentionLedger } from "./mention-ledger.js";

test("MemoryMentionLedgerStore finds what it saved", () => {
  const store = newMemoryMentionLedgerStore();
  const item = newMentionLedger("code-743", "name-566");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
