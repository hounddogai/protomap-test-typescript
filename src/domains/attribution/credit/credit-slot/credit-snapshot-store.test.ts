import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditSnapshotStore } from "./credit-snapshot-store.js";
import { newCreditSnapshot } from "./credit-snapshot.js";

test("MemoryCreditSnapshotStore finds what it saved", () => {
  const store = newMemoryCreditSnapshotStore();
  const item = newCreditSnapshot("code-744", "title-688");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
