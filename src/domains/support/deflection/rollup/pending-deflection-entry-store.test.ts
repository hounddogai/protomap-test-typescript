import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingDeflectionEntryStore } from "./pending-deflection-entry-store.js";
import { newPendingDeflectionEntry } from "./pending-deflection-entry.js";

test("MemoryPendingDeflectionEntryStore finds what it saved", () => {
  const store = newMemoryPendingDeflectionEntryStore();
  const item = newPendingDeflectionEntry("code-705", "name-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
