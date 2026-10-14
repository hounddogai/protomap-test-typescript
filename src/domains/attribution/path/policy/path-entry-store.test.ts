import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathEntryStore } from "./path-entry-store.js";
import { newPathEntry } from "./path-entry.js";

test("MemoryPathEntryStore finds what it saved", () => {
  const store = newMemoryPathEntryStore();
  const item = newPathEntry("code-631", "title-602");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
