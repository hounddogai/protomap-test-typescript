import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofEntryStore } from "./proof-entry-store.js";
import { newProofEntry } from "./proof-entry.js";

test("MemoryProofEntryStore finds what it saved", () => {
  const store = newMemoryProofEntryStore();
  const item = newProofEntry("code-417", "title-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
