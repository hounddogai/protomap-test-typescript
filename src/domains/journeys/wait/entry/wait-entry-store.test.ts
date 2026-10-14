import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitEntryStore } from "./wait-entry-store.js";
import { newWaitEntry } from "./wait-entry.js";

test("MemoryWaitEntryStore finds what it saved", () => {
  const store = newMemoryWaitEntryStore();
  const item = newWaitEntry("code-273", "title-889");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
