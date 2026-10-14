import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutEntryStore } from "./opt-out-entry-store.js";
import { newOptOutEntry } from "./opt-out-entry.js";

test("MemoryOptOutEntryStore finds what it saved", () => {
  const store = newMemoryOptOutEntryStore();
  const item = newOptOutEntry("code-329", "name-515");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
