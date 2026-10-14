import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPreferenceSnapshotStore } from "./tiered-preference-snapshot-store.js";
import { newTieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

test("MemoryTieredPreferenceSnapshotStore finds what it saved", () => {
  const store = newMemoryTieredPreferenceSnapshotStore();
  const item = newTieredPreferenceSnapshot("code-140", "name-989");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
