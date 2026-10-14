import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPathEntryStore } from "./scheduled-path-entry-store.js";
import { newScheduledPathEntry } from "./scheduled-path-entry.js";

test("MemoryScheduledPathEntryStore finds what it saved", () => {
  const store = newMemoryScheduledPathEntryStore();
  const item = newScheduledPathEntry("code-703", "name-403");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
