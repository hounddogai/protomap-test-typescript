import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalModelEntryStore } from "./regional-model-entry-store.js";
import { newRegionalModelEntry } from "./regional-model-entry.js";

test("MemoryRegionalModelEntryStore finds what it saved", () => {
  const store = newMemoryRegionalModelEntryStore();
  const item = newRegionalModelEntry("code-300", "title-62");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
