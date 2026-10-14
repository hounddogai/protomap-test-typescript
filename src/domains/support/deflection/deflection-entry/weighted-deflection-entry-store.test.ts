import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDeflectionEntryStore } from "./weighted-deflection-entry-store.js";
import { newWeightedDeflectionEntry } from "./weighted-deflection-entry.js";

test("MemoryWeightedDeflectionEntryStore finds what it saved", () => {
  const store = newMemoryWeightedDeflectionEntryStore();
  const item = newWeightedDeflectionEntry("code-362", "label-519");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
