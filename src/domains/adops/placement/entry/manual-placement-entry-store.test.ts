import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPlacementEntryStore } from "./manual-placement-entry-store.js";
import { newManualPlacementEntry } from "./manual-placement-entry.js";

test("MemoryManualPlacementEntryStore finds what it saved", () => {
  const store = newMemoryManualPlacementEntryStore();
  const item = newManualPlacementEntry("code-369", "title-761");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
