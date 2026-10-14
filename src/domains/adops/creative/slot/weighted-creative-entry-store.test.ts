import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCreativeEntryStore } from "./weighted-creative-entry-store.js";
import { newWeightedCreativeEntry } from "./weighted-creative-entry.js";

test("MemoryWeightedCreativeEntryStore finds what it saved", () => {
  const store = newMemoryWeightedCreativeEntryStore();
  const item = newWeightedCreativeEntry("code-277", "label-945");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
