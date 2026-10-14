import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedLevelEntryStore } from "./batched-level-entry-store.js";
import { newBatchedLevelEntry } from "./batched-level-entry.js";

test("MemoryBatchedLevelEntryStore finds what it saved", () => {
  const store = newMemoryBatchedLevelEntryStore();
  const item = newBatchedLevelEntry("code-792", "name-116");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
