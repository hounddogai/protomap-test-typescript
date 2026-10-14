import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultLevelEntryStore } from "./default-level-entry-store.js";
import { newDefaultLevelEntry } from "./default-level-entry.js";

test("MemoryDefaultLevelEntryStore finds what it saved", () => {
  const store = newMemoryDefaultLevelEntryStore();
  const item = newDefaultLevelEntry("code-768", "label-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
