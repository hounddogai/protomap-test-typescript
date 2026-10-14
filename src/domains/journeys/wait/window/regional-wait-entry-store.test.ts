import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalWaitEntryStore } from "./regional-wait-entry-store.js";
import { newRegionalWaitEntry } from "./regional-wait-entry.js";

test("MemoryRegionalWaitEntryStore finds what it saved", () => {
  const store = newMemoryRegionalWaitEntryStore();
  const item = newRegionalWaitEntry("code-220", "label-2");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
