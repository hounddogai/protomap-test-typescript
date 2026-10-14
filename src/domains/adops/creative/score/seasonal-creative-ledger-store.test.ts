import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreativeLedgerStore } from "./seasonal-creative-ledger-store.js";
import { newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("MemorySeasonalCreativeLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalCreativeLedgerStore();
  const item = newSeasonalCreativeLedger("code-727", "label-471");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
