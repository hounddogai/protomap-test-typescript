import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionEntryStore } from "./deflection-entry-store.js";
import { newDeflectionEntry } from "./deflection-entry.js";

test("MemoryDeflectionEntryStore finds what it saved", () => {
  const store = newMemoryDeflectionEntryStore();
  const item = newDeflectionEntry("code-972", "title-301");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
