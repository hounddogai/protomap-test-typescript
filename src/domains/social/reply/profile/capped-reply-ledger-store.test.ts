import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedReplyLedgerStore } from "./capped-reply-ledger-store.js";
import { newCappedReplyLedger } from "./capped-reply-ledger.js";

test("MemoryCappedReplyLedgerStore finds what it saved", () => {
  const store = newMemoryCappedReplyLedgerStore();
  const item = newCappedReplyLedger("code-848", "title-172");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
