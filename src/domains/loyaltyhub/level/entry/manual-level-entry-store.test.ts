import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLevelEntryStore } from "./manual-level-entry-store.js";
import { newManualLevelEntry } from "./manual-level-entry.js";

test("MemoryManualLevelEntryStore finds what it saved", () => {
  const store = newMemoryManualLevelEntryStore();
  const item = newManualLevelEntry("code-163", "label-508");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
