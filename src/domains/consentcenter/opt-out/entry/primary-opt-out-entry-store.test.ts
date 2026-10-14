import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryOptOutEntryStore } from "./primary-opt-out-entry-store.js";
import { newPrimaryOptOutEntry } from "./primary-opt-out-entry.js";

test("MemoryPrimaryOptOutEntryStore finds what it saved", () => {
  const store = newMemoryPrimaryOptOutEntryStore();
  const item = newPrimaryOptOutEntry("code-797", "label-994");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
