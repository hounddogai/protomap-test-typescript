import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierEntryStore } from "./tier-entry-store.js";
import { newTierEntry } from "./tier-entry.js";

test("MemoryTierEntryStore finds what it saved", () => {
  const store = newMemoryTierEntryStore();
  const item = newTierEntry("code-63", "name-725");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
