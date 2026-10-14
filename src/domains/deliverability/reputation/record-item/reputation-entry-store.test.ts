import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationEntryStore } from "./reputation-entry-store.js";
import { newReputationEntry } from "./reputation-entry.js";

test("MemoryReputationEntryStore finds what it saved", () => {
  const store = newMemoryReputationEntryStore();
  const item = newReputationEntry("code-901", "label-279");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
