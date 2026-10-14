import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowEntryStore } from "./window-entry-store.js";
import { newWindowEntry } from "./window-entry.js";

test("MemoryWindowEntryStore finds what it saved", () => {
  const store = newMemoryWindowEntryStore();
  const item = newWindowEntry("code-496", "name-967");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
