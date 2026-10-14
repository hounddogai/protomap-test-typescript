import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderLedgerStore } from "./sender-ledger-store.js";
import { newSenderLedger } from "./sender-ledger.js";

test("MemorySenderLedgerStore finds what it saved", () => {
  const store = newMemorySenderLedgerStore();
  const item = newSenderLedger("code-851", "label-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
