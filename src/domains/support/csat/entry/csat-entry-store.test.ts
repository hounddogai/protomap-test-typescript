import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatEntryStore } from "./csat-entry-store.js";
import { newCsatEntry } from "./csat-entry.js";

test("MemoryCsatEntryStore finds what it saved", () => {
  const store = newMemoryCsatEntryStore();
  const item = newCsatEntry("code-747", "label-593");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
