import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTouchpointSnapshotStore } from "./capped-touchpoint-snapshot-store.js";
import { newCappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

test("MemoryCappedTouchpointSnapshotStore finds what it saved", () => {
  const store = newMemoryCappedTouchpointSnapshotStore();
  const item = newCappedTouchpointSnapshot("code-873", "title-654");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
