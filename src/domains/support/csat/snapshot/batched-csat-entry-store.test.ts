import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCsatEntryStore } from "./batched-csat-entry-store.js";
import { newBatchedCsatEntry } from "./batched-csat-entry.js";

test("MemoryBatchedCsatEntryStore finds what it saved", () => {
  const store = newMemoryBatchedCsatEntryStore();
  const item = newBatchedCsatEntry("code-134", "title-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
