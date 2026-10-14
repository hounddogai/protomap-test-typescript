import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchEntryStore } from "./branch-entry-store.js";
import { newBranchEntry } from "./branch-entry.js";

test("MemoryBranchEntryStore finds what it saved", () => {
  const store = newMemoryBranchEntryStore();
  const item = newBranchEntry("code-828", "name-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
