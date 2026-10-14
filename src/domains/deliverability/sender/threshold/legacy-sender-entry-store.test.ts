import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySenderEntryStore } from "./legacy-sender-entry-store.js";
import { newLegacySenderEntry } from "./legacy-sender-entry.js";

test("MemoryLegacySenderEntryStore finds what it saved", () => {
  const store = newMemoryLegacySenderEntryStore();
  const item = newLegacySenderEntry("code-964", "title-360");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
