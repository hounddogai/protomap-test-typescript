import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictProofEntryStore } from "./strict-proof-entry-store.js";
import { newStrictProofEntry } from "./strict-proof-entry.js";

test("MemoryStrictProofEntryStore finds what it saved", () => {
  const store = newMemoryStrictProofEntryStore();
  const item = newStrictProofEntry("code-243", "name-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
