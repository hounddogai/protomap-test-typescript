import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredMacroSnapshotStore } from "./tiered-macro-snapshot-store.js";
import { newTieredMacroSnapshot } from "./tiered-macro-snapshot.js";

test("MemoryTieredMacroSnapshotStore finds what it saved", () => {
  const store = newMemoryTieredMacroSnapshotStore();
  const item = newTieredMacroSnapshot("code-450", "name-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
