import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryMacroEntryStore } from "./primary-macro-entry-store.js";
import { newPrimaryMacroEntry } from "./primary-macro-entry.js";

test("MemoryPrimaryMacroEntryStore finds what it saved", () => {
  const store = newMemoryPrimaryMacroEntryStore();
  const item = newPrimaryMacroEntry("code-679", "name-79");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
