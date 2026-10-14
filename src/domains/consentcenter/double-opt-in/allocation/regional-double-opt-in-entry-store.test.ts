import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalDoubleOptInEntryStore } from "./regional-double-opt-in-entry-store.js";
import { newRegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

test("MemoryRegionalDoubleOptInEntryStore finds what it saved", () => {
  const store = newMemoryRegionalDoubleOptInEntryStore();
  const item = newRegionalDoubleOptInEntry("code-260", "label-736");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
