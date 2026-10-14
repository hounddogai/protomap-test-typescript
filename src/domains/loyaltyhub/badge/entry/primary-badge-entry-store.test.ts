import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBadgeEntryStore } from "./primary-badge-entry-store.js";
import { newPrimaryBadgeEntry } from "./primary-badge-entry.js";

test("MemoryPrimaryBadgeEntryStore finds what it saved", () => {
  const store = newMemoryPrimaryBadgeEntryStore();
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
