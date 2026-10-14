import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointSnapshotStore } from "./touchpoint-snapshot-store.js";
import { newTouchpointSnapshot } from "./touchpoint-snapshot.js";

test("MemoryTouchpointSnapshotStore finds what it saved", () => {
  const store = newMemoryTouchpointSnapshotStore();
  const item = newTouchpointSnapshot("code-909", "name-752");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
