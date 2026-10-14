import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCreativeEntryStore } from "./regional-creative-entry-store.js";
import { newRegionalCreativeEntry } from "./regional-creative-entry.js";

test("MemoryRegionalCreativeEntryStore finds what it saved", () => {
  const store = newMemoryRegionalCreativeEntryStore();
  const item = newRegionalCreativeEntry("code-798", "label-446");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
