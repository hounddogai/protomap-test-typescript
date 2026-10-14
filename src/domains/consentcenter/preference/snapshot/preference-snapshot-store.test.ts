import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceSnapshotStore } from "./preference-snapshot-store.js";
import { newPreferenceSnapshot } from "./preference-snapshot.js";

test("MemoryPreferenceSnapshotStore finds what it saved", () => {
  const store = newMemoryPreferenceSnapshotStore();
  const item = newPreferenceSnapshot("code-640", "label-261");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
